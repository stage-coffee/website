import { init, type PageAppSDK } from '@contentful/app-sdk'
import type { EntryProps } from 'contentful-management'
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import {
  archiveCoffee as archiveCoffeeEntry,
  adminMobileZoom,
  coffeeEntryStatus,
  coffeeFormFromEntry,
  coffeeFormToFields,
  emptyCoffeeForm,
  isVersionConflict,
  PublishFailedError,
  restoreCoffee as restoreCoffeeEntry,
  saveAndPublishCoffee,
  validateCoffeeForm,
  type CoffeeAdminAction,
  type CoffeeAdminGateway,
  type CoffeeEntryLike,
  type CoffeeForm,
} from '../lib/coffee-admin'
import {
  menuBlocksFromMarkdown,
  menuFieldsFromMarkdown,
  menuFormFromEntry,
  menuMarkdownFromBlocks,
  saveAndPublishMenu,
  validateMenuForm,
  type MenuAdminGateway,
  type MenuForm,
} from '../lib/menu-admin'

type Props = { adminUrl: string }
type RawCoffeeEntry = EntryProps<Record<string, unknown>>
type EditorState = { entry: RawCoffeeEntry | null; initial: string }
type FieldError = Partial<Record<keyof CoffeeForm | 'sections', string>>
type AdminSection = 'coffees' | 'menu'

const byUpdatedDate = (first: RawCoffeeEntry, second: RawCoffeeEntry) =>
  new Date(second.sys.updatedAt).getTime() -
    new Date(first.sys.updatedAt).getTime() ||
  String(first.fields.coffeeName).localeCompare(
    String(second.fields.coffeeName)
  )

const errorMessage = (error: unknown) => {
  if (isVersionConflict(error)) {
    return 'This content changed after you opened it. Your changes were not overwritten. Reload it and review the latest version.'
  }
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: string
      response?: { status?: number }
    }
    if (candidate.response?.status === 403) {
      return 'Your Contentful role does not allow that action.'
    }
    if (candidate.message) return candidate.message
  }
  return 'Contentful could not complete that action. Please try again.'
}

const Field = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
}: {
  label: string
  name: keyof CoffeeForm
  value: string
  onChange: (name: keyof CoffeeForm, value: string) => void
  error?: string
  required?: boolean
}) => (
  <label className="admin-field">
    <span>
      {label} {required ? <small>Required</small> : null}
    </span>
    <input
      name={name}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${name}-error` : undefined}
      required={required}
    />
    {error ? (
      <span className="admin-field-error" id={`${name}-error`}>
        {error}
      </span>
    ) : null}
  </label>
)

export default function CoffeeAdminApp({ adminUrl }: Props) {
  const [sdk, setSdk] = useState<PageAppSDK | null>(null)
  const [entries, setEntries] = useState<RawCoffeeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [form, setForm] = useState<CoffeeForm>(emptyCoffeeForm)
  const [errors, setErrors] = useState<FieldError>({})
  const [standalone, setStandalone] = useState(false)
  const [section, setSection] = useState<AdminSection>('coffees')
  const [menuEntry, setMenuEntry] = useState<RawCoffeeEntry | null>(null)
  const [menuForm, setMenuForm] = useState<MenuForm>({
    name: 'Main food menu',
    intro: '',
    blocks: [],
  })
  const [menuIntro, setMenuIntro] = useState('')
  const [menuMarkdown, setMenuMarkdown] = useState('')
  const [menuInitial, setMenuInitial] = useState('')
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuValidationError, setMenuValidationError] = useState('')

  useEffect(() => {
    const root = document.documentElement
    const updateScale = () => {
      root.style.setProperty(
        '--admin-mobile-zoom',
        String(adminMobileZoom(window.innerWidth, window.screen.width))
      )
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    window.visualViewport?.addEventListener('resize', updateScale)
    return () => {
      window.removeEventListener('resize', updateScale)
      window.visualViewport?.removeEventListener('resize', updateScale)
      root.style.removeProperty('--admin-mobile-zoom')
    }
  }, [])

  const loadEntries = async (app: PageAppSDK) => {
    setLoading(true)
    setError('')
    try {
      const [active, archived] = await Promise.all([
        app.cma.entry.getMany<Record<string, unknown>>({
          query: {
            content_type: 'coffee',
            limit: 1000,
            'sys.archivedAt[exists]': false,
          },
        }),
        app.cma.entry.getMany<Record<string, unknown>>({
          query: {
            content_type: 'coffee',
            limit: 1000,
            'sys.archivedAt[exists]': true,
          },
        }),
      ])
      const unique = new Map<string, RawCoffeeEntry>()
      for (const entry of [...active.items, ...archived.items]) {
        unique.set(entry.sys.id, entry)
      }
      setEntries([...unique.values()].sort(byUpdatedDate))
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  const loadMenu = async (app: PageAppSDK) => {
    setMenuLoading(true)
    try {
      const result = await app.cma.entry.getMany<Record<string, unknown>>({
        query: {
          content_type: 'foodMenu',
          limit: 1,
          'sys.archivedAt[exists]': false,
        },
      })
      const entry = result.items[0] || null
      const values = menuFormFromEntry(
        entry as CoffeeEntryLike | null,
        app.locales.default
      )
      const markdown = menuMarkdownFromBlocks(values.blocks)
      setMenuEntry(entry)
      setMenuForm(values)
      setMenuIntro(values.intro)
      setMenuMarkdown(markdown)
      setMenuInitial(JSON.stringify({ intro: values.intro, markdown }))
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setMenuLoading(false)
    }
  }

  useEffect(() => {
    if (window.self === window.top) {
      if (adminUrl) window.location.replace(adminUrl)
      else setStandalone(true)
      return
    }

    init<PageAppSDK>((app) => {
      setSdk(app)
      void loadEntries(app)
      void loadMenu(app)
    })
  }, [adminUrl])

  const locale = sdk?.locales.default || 'en-US'
  const coffeeDirty = editor ? JSON.stringify(form) !== editor.initial : false
  const menuDirty =
    JSON.stringify({ intro: menuIntro, markdown: menuMarkdown }) !== menuInitial
  const dirty = coffeeDirty || menuDirty

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const visibleEntries = useMemo(() => {
    const term = search.trim().toLowerCase()
    return entries.filter((entry) => {
      const archived = Boolean(entry.sys.archivedAt)
      if (archived !== showArchived) return false
      if (!term) return true
      const values = coffeeFormFromEntry(entry as CoffeeEntryLike, locale)
      return [values.coffeeName, values.coffeeRoaster, values.origin]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [entries, locale, search, showArchived])

  const updateForm = (name: keyof CoffeeForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const openEditor = (entry: RawCoffeeEntry | null) => {
    const values = entry
      ? coffeeFormFromEntry(entry as CoffeeEntryLike, locale)
      : emptyCoffeeForm()
    setForm(values)
    setEditor({ entry, initial: JSON.stringify(values) })
    setErrors({})
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeEditor = async () => {
    if (!sdk) return
    if (dirty) {
      const confirmed = await sdk.dialogs.openConfirm({
        title: 'Discard unsaved changes?',
        message: 'Your changes to this coffee will be lost.',
        confirmLabel: 'Discard changes',
        cancelLabel: 'Keep editing',
        intent: 'negative',
      })
      if (!confirmed) return
    }
    setEditor(null)
    setErrors({})
    setError('')
  }

  const changeSection = async (nextSection: AdminSection) => {
    if (nextSection === section) return
    if (dirty && sdk) {
      const confirmed = await sdk.dialogs.openConfirm({
        title: 'Discard unsaved changes?',
        message: 'Your changes will be lost when you change admin section.',
        confirmLabel: 'Discard changes',
        cancelLabel: 'Keep editing',
        intent: 'negative',
      })
      if (!confirmed) return
      if (editor) setEditor(null)
      if (menuInitial) {
        const initial = JSON.parse(menuInitial) as {
          intro: string
          markdown: string
        }
        setMenuIntro(initial.intro)
        setMenuMarkdown(initial.markdown)
      }
    }
    setErrors({})
    setMenuValidationError('')
    setError('')
    setNotice('')
    setSection(nextSection)
  }

  const requireAccess = async (action: CoffeeAdminAction, entity: object) => {
    if (!sdk) throw new Error('The Contentful app is not connected.')
    let allowed = false
    switch (action) {
      case 'create':
      case 'update':
        allowed = await sdk.access.can(action, entity)
        break
      case 'publish':
      case 'unpublish':
        allowed = await sdk.access.can(action, entity)
        break
      case 'archive':
      case 'unarchive':
        allowed = await sdk.access.can(action, entity)
        break
    }
    if (!allowed) {
      throw Object.assign(
        new Error('Your Contentful role does not allow that action.'),
        {
          response: { status: 403 },
        }
      )
    }
  }

  const gateway = (): CoffeeAdminGateway<RawCoffeeEntry> => {
    if (!sdk) throw new Error('The Contentful app is not connected.')
    return {
      get: (entryId) => sdk.cma.entry.get<Record<string, unknown>>({ entryId }),
      create: (fields) =>
        sdk.cma.entry.create({ contentTypeId: 'coffee' }, { fields }),
      update: (entry, fields) =>
        sdk.cma.entry.update(
          { entryId: entry.sys.id },
          { ...entry, fields: { ...entry.fields, ...fields } }
        ),
      publish: (entry) =>
        sdk.cma.entry.publish({ entryId: entry.sys.id }, entry),
      unpublish: (entry) =>
        sdk.cma.entry.unpublish({ entryId: entry.sys.id }, entry),
      archive: (entry) => sdk.cma.entry.archive({ entryId: entry.sys.id }),
      unarchive: (entry) => sdk.cma.entry.unarchive({ entryId: entry.sys.id }),
      requireAccess,
    }
  }

  const menuGateway = (): MenuAdminGateway<RawCoffeeEntry> => {
    if (!sdk) throw new Error('The Contentful app is not connected.')
    return {
      get: (entryId) => sdk.cma.entry.get<Record<string, unknown>>({ entryId }),
      create: (fields) =>
        sdk.cma.entry.create({ contentTypeId: 'foodMenu' }, { fields }),
      update: (entry, fields) =>
        sdk.cma.entry.update(
          { entryId: entry.sys.id },
          { ...entry, fields: { ...entry.fields, ...fields } }
        ),
      publish: (entry) =>
        sdk.cma.entry.publish({ entryId: entry.sys.id }, entry),
      requireAccess,
    }
  }

  const resetMenu = () => {
    if (!menuInitial) return
    const initial = JSON.parse(menuInitial) as {
      intro: string
      markdown: string
    }
    setMenuIntro(initial.intro)
    setMenuMarkdown(initial.markdown)
    setMenuValidationError('')
    setError('')
  }

  const saveMenu = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!sdk) return
    const nextForm = {
      ...menuForm,
      intro: menuIntro,
      blocks: menuBlocksFromMarkdown(menuMarkdown),
    }
    const validationError = validateMenuForm(nextForm)
    setMenuValidationError(validationError)
    if (validationError) {
      setError('Check the food menu before publishing.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const published = await saveAndPublishMenu(
        menuGateway(),
        menuEntry,
        menuFieldsFromMarkdown(
          nextForm.name,
          nextForm.intro,
          menuMarkdown,
          locale
        )
      )
      const values = menuFormFromEntry(published as CoffeeEntryLike, locale)
      const markdown = menuMarkdownFromBlocks(values.blocks)
      setMenuEntry(published)
      setMenuForm(values)
      setMenuIntro(values.intro)
      setMenuMarkdown(markdown)
      setMenuInitial(JSON.stringify({ intro: values.intro, markdown }))
      sdk.notifier.success('Food menu published')
      setNotice(
        'The food menu was published. The website is rebuilding and may take a few minutes to update.'
      )
    } catch (saveError) {
      setError(errorMessage(saveError))
    } finally {
      setBusy(false)
    }
  }

  const save = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!sdk || !editor) return
    const nextErrors = validateCoffeeForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setError('Check the highlighted fields before publishing.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const localizedFields = coffeeFormToFields(form, locale)
      await saveAndPublishCoffee(gateway(), editor.entry, localizedFields)

      sdk.notifier.success(`${form.coffeeName.trim()} published`)
      setNotice(
        `${form.coffeeName.trim()} was published. The website is rebuilding and may take a few minutes to update.`
      )
      setEditor(null)
      await loadEntries(sdk)
    } catch (saveError) {
      setError(
        saveError instanceof PublishFailedError
          ? 'The coffee was saved as a draft, but Contentful could not publish it. Open the entry again or publish it in Contentful.'
          : errorMessage(saveError)
      )
    } finally {
      setBusy(false)
    }
  }

  const archive = async (entry: RawCoffeeEntry) => {
    if (!sdk) return
    const values = coffeeFormFromEntry(entry as CoffeeEntryLike, locale)
    const confirmed = await sdk.dialogs.openConfirm({
      title: `Remove ${values.coffeeName || 'this coffee'}?`,
      message:
        'It will be unpublished and archived, but it can be restored later.',
      confirmLabel: 'Remove coffee',
      cancelLabel: 'Keep coffee',
      intent: 'negative',
    })
    if (!confirmed) return

    setBusy(true)
    setError('')
    setNotice('')
    try {
      await archiveCoffeeEntry(gateway(), entry)
      sdk.notifier.success(`${values.coffeeName} archived`)
      setNotice(
        `${values.coffeeName} was removed and archived. The website is rebuilding and may take a few minutes to update.`
      )
      await loadEntries(sdk)
    } catch (archiveError) {
      setError(errorMessage(archiveError))
    } finally {
      setBusy(false)
    }
  }

  const restore = async (entry: RawCoffeeEntry) => {
    if (!sdk) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const restored = await restoreCoffeeEntry(gateway(), entry)
      sdk.notifier.success('Coffee restored as a draft')
      await loadEntries(sdk)
      openEditor(restored)
    } catch (restoreError) {
      setError(errorMessage(restoreError))
    } finally {
      setBusy(false)
    }
  }

  if (standalone) {
    return (
      <main className="admin-standalone">
        <div className="admin-empty-card">
          <h1>Website admin</h1>
          <p>
            The Contentful admin app has not been configured yet. Add the public
            app ID and rebuild the website.
          </p>
        </div>
      </main>
    )
  }

  if (!sdk) {
    return (
      <main className="admin-standalone" aria-live="polite">
        <div className="admin-empty-card">Opening secure website admin…</div>
      </main>
    )
  }

  const staffName = [sdk.user.firstName, sdk.user.lastName]
    .filter(Boolean)
    .join(' ')
  const roleNames = sdk.user.spaceMembership.roles
    .map((role) => role.name)
    .join(', ')

  return (
    <main className="coffee-admin">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Stage Espresso &amp; Brewbar</p>
          <h1>
            {section === 'menu'
              ? 'Food menu'
              : editor
                ? editor.entry
                  ? 'Edit coffee'
                  : 'New coffee'
                : 'Coffees'}
          </h1>
        </div>
        <div className="admin-user">
          <strong>{staffName || sdk.user.email}</strong>
          {roleNames ? <span>{roleNames}</span> : null}
        </div>
      </header>

      <nav className="admin-section-tabs" aria-label="Website admin sections">
        <button
          type="button"
          aria-current={section === 'coffees' ? 'page' : undefined}
          onClick={() => void changeSection('coffees')}
        >
          Coffees
        </button>
        <button
          type="button"
          aria-current={section === 'menu' ? 'page' : undefined}
          onClick={() => void changeSection('menu')}
        >
          Food menu
        </button>
      </nav>

      {error ? (
        <div className="admin-message admin-message-error" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="admin-message admin-message-success" role="status">
          {notice}
        </div>
      ) : null}

      {section === 'menu' ? (
        menuLoading ? (
          <p aria-live="polite">Loading food menu…</p>
        ) : (
          <form className="admin-form admin-menu-form" onSubmit={saveMenu}>
            <section className="admin-form-section">
              <div className="admin-menu-heading">
                <div>
                  <h2>Menu content</h2>
                  <p className="admin-help">
                    Use Markdown to format the menu. Leave a blank line between
                    each piece of content.
                  </p>
                </div>
                {menuEntry ? (
                  <span
                    className={`admin-status admin-status-${coffeeEntryStatus(menuEntry as CoffeeEntryLike).toLowerCase()}`}
                  >
                    {coffeeEntryStatus(menuEntry as CoffeeEntryLike)}
                  </span>
                ) : null}
              </div>

              <label className="admin-field">
                <span>Introduction</span>
                <textarea
                  className="admin-menu-intro"
                  rows={5}
                  value={menuIntro}
                  onChange={(event) => {
                    setMenuIntro(event.target.value)
                    setMenuValidationError('')
                  }}
                  spellCheck
                  required
                />
              </label>

              <div className="admin-markdown-guide" aria-label="Markdown help">
                <code>## Section heading</code>
                <code>### Dish and price</code>
                <code>*Allergen information*</code>
                <code>**Highlighted note**</code>
                <code>Plain description</code>
              </div>
              <label className="admin-field">
                <span className="visually-hidden">Food menu Markdown</span>
                <textarea
                  className="admin-menu-markdown"
                  rows={28}
                  value={menuMarkdown}
                  onChange={(event) => {
                    setMenuMarkdown(event.target.value)
                    setMenuValidationError('')
                  }}
                  spellCheck
                  placeholder="## Food&#10;&#10;### Dish name — £5.95&#10;&#10;*Allergens: Gluten.*&#10;&#10;Description of the dish."
                />
              </label>
              {menuValidationError ? (
                <p className="admin-field-error" role="alert">
                  {menuValidationError}
                </p>
              ) : null}
            </section>

            <div className="admin-form-actions">
              <button
                className="admin-secondary-button"
                type="button"
                onClick={resetMenu}
                disabled={busy || !menuDirty}
              >
                Reset changes
              </button>
              <button
                className="admin-primary-button"
                type="submit"
                disabled={busy || !menuDirty}
              >
                {busy ? 'Publishing…' : 'Save and publish'}
              </button>
            </div>
          </form>
        )
      ) : editor ? (
        <form className="admin-form" onSubmit={save}>
          <section className="admin-form-section">
            <h2>Coffee</h2>
            <Field
              label="Coffee name"
              name="coffeeName"
              value={form.coffeeName}
              onChange={updateForm}
              error={errors.coffeeName}
              required
            />
            <Field
              label="Roastery"
              name="coffeeRoaster"
              value={form.coffeeRoaster}
              onChange={updateForm}
              error={errors.coffeeRoaster}
              required
            />
            <label className="admin-field">
              <span>
                Tasting notes <small>Required</small>
              </span>
              <textarea
                name="notes"
                rows={5}
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
                aria-invalid={Boolean(errors.notes)}
                aria-describedby={errors.notes ? 'notes-error' : undefined}
                required
              />
              {errors.notes ? (
                <span className="admin-field-error" id="notes-error">
                  {errors.notes}
                </span>
              ) : null}
            </label>
            <label className="admin-field">
              <span>Caffeine</span>
              <select
                value={form.caffeine}
                onChange={(event) => updateForm('caffeine', event.target.value)}
              >
                <option>Caffeinated</option>
                <option>Decaf</option>
              </select>
            </label>
          </section>

          <section className="admin-form-section">
            <h2>Where it appears</h2>
            <div className="admin-checkboxes">
              {(
                [
                  ['houseEspresso', 'Espresso'],
                  ['houseBatch', 'Batch'],
                  ['filter', 'Pour Over'],
                  ['retail', 'Retail'],
                ] as const
              ).map(([name, label]) => (
                <label key={name}>
                  <input
                    type="checkbox"
                    checked={form[name]}
                    onChange={(event) => updateForm(name, event.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.sections ? (
              <p className="admin-field-error" role="alert">
                {errors.sections}
              </p>
            ) : null}
          </section>

          <section className="admin-form-section">
            <h2>Origin and production</h2>
            <Field
              label="Origin"
              name="origin"
              value={form.origin}
              onChange={updateForm}
              error={errors.origin}
              required
            />
            <Field
              label="Region"
              name="region"
              value={form.region}
              onChange={updateForm}
            />
            <Field
              label="Altitude"
              name="altitude"
              value={form.altitude}
              onChange={updateForm}
            />
            <Field
              label="Producer"
              name="producer"
              value={form.producer}
              onChange={updateForm}
            />
            <Field
              label="Farm"
              name="farm"
              value={form.farm}
              onChange={updateForm}
            />
            <Field
              label="Varietal"
              name="varietal"
              value={form.varietal}
              onChange={updateForm}
            />
            <Field
              label="Process"
              name="process"
              value={form.process}
              onChange={updateForm}
            />
          </section>

          <section className="admin-form-section">
            <h2>Prices</h2>
            <p className="admin-help">
              Add one line for each option, such as “Filter — £5.00”.
            </p>
            <div className="admin-price-list">
              {form.prices.map((price, index) => (
                <div className="admin-price-row" key={index}>
                  <label>
                    <span className="visually-hidden">Price {index + 1}</span>
                    <input
                      value={price}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          prices: current.prices.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item
                          ),
                        }))
                      }
                    />
                  </label>
                  <button
                    className="admin-icon-button"
                    type="button"
                    aria-label={`Remove price ${index + 1}`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        prices:
                          current.prices.length === 1
                            ? ['']
                            : current.prices.filter(
                                (_item, itemIndex) => itemIndex !== index
                              ),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  prices: [...current.prices, ''],
                }))
              }
            >
              Add another price
            </button>
          </section>

          <div className="admin-form-actions">
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => void closeEditor()}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="admin-primary-button"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Publishing…' : 'Save and publish'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="admin-toolbar">
            <label className="admin-search">
              <span className="visually-hidden">Search coffees</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search coffees"
              />
            </label>
            <button
              className="admin-primary-button"
              onClick={() => openEditor(null)}
              disabled={busy}
            >
              Add coffee
            </button>
          </div>
          <div className="admin-tabs" role="group" aria-label="Coffee status">
            <button
              aria-pressed={!showArchived}
              onClick={() => setShowArchived(false)}
            >
              Active
            </button>
            <button
              aria-pressed={showArchived}
              onClick={() => setShowArchived(true)}
            >
              Archived
            </button>
          </div>

          {loading ? <p aria-live="polite">Loading coffees…</p> : null}
          {!loading && !visibleEntries.length ? (
            <div className="admin-empty-card">
              No {showArchived ? 'archived' : 'active'} coffees match your
              search.
            </div>
          ) : null}
          <div className="admin-coffee-list">
            {visibleEntries.map((entry) => {
              const values = coffeeFormFromEntry(
                entry as CoffeeEntryLike,
                locale
              )
              const sections = [
                values.houseEspresso && 'Espresso',
                values.houseBatch && 'Batch',
                values.filter && 'Pour Over',
                values.retail && 'Retail',
              ].filter(Boolean)
              return (
                <article className="admin-coffee-card" key={entry.sys.id}>
                  <div>
                    <div className="admin-card-heading">
                      <h2>{values.coffeeName || 'Untitled coffee'}</h2>
                      <span
                        className={`admin-status admin-status-${coffeeEntryStatus(entry as CoffeeEntryLike).toLowerCase()}`}
                      >
                        {coffeeEntryStatus(entry as CoffeeEntryLike)}
                      </span>
                    </div>
                    <p className="admin-card-roaster">
                      {values.coffeeRoaster || 'No roastery'}
                    </p>
                    <p>
                      {[values.caffeine, values.origin]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {sections.length ? (
                      <p className="admin-card-sections">
                        {sections.join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  <div className="admin-card-actions">
                    {showArchived ? (
                      <button
                        className="admin-secondary-button"
                        onClick={() => void restore(entry)}
                        disabled={busy}
                      >
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          className="admin-secondary-button"
                          type="button"
                          onClick={() => openEditor(entry)}
                          disabled={busy}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-danger-button"
                          type="button"
                          onClick={() => void archive(entry)}
                          disabled={busy}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
