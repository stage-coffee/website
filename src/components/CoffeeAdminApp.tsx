import { init, type PageAppSDK } from '@contentful/app-sdk'
import type { EntryProps } from 'contentful-management'
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import {
  archiveCoffee as archiveCoffeeEntry,
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

type Props = { adminUrl: string }
type RawCoffeeEntry = EntryProps<Record<string, unknown>>
type EditorState = { entry: RawCoffeeEntry | null; initial: string }
type FieldError = Partial<Record<keyof CoffeeForm | 'sections', string>>

const byUpdatedDate = (first: RawCoffeeEntry, second: RawCoffeeEntry) =>
  new Date(second.sys.updatedAt).getTime() -
    new Date(first.sys.updatedAt).getTime() ||
  String(first.fields.coffeeName).localeCompare(
    String(second.fields.coffeeName)
  )

const errorMessage = (error: unknown) => {
  if (isVersionConflict(error)) {
    return 'This coffee changed after you opened it. Your changes were not overwritten. Reload it and review the latest version.'
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

  useEffect(() => {
    if (window.self === window.top) {
      if (adminUrl) window.location.replace(adminUrl)
      else setStandalone(true)
      return
    }

    init<PageAppSDK>((app) => {
      setSdk(app)
      void loadEntries(app)
    })
  }, [adminUrl])

  const locale = sdk?.locales.default || 'en-US'
  const dirty = editor ? JSON.stringify(form) !== editor.initial : false

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

  const closeEditor = () => {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return
    setEditor(null)
    setErrors({})
    setError('')
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
    if (
      !window.confirm(
        `Remove ${values.coffeeName} from the website? It will be unpublished and archived, but can be restored.`
      )
    )
      return

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
          <h1>Coffee admin</h1>
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
        <div className="admin-empty-card">Opening secure coffee admin…</div>
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
            {editor
              ? editor.entry
                ? 'Edit coffee'
                : 'New coffee'
              : 'Coffee admin'}
          </h1>
        </div>
        <div className="admin-user">
          <strong>{staffName || sdk.user.email}</strong>
          {roleNames ? <span>{roleNames}</span> : null}
        </div>
      </header>

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

      {editor ? (
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
                  ['houseEspresso', 'House Espresso'],
                  ['houseBatch', 'House Batch'],
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
              onClick={closeEditor}
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
                values.houseEspresso && 'House Espresso',
                values.houseBatch && 'House Batch',
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
                          onClick={() => openEditor(entry)}
                          disabled={busy}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-danger-button"
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
