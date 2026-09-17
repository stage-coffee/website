import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Coffee, FoodMenu } from '../lib/contentful'
import CoffeeView from './CoffeeView'
import MenuView from './MenuView'

type MenuTab = 'food' | 'coffee'

const tabFromLocation = (): MenuTab => {
  if (typeof window === 'undefined') return 'food'
  return new URLSearchParams(window.location.search).get('tab') === 'coffee'
    ? 'coffee'
    : 'food'
}

export default function MenuTabsView({
  menu,
  coffees,
}: {
  menu: FoodMenu | null
  coffees: Coffee[]
}) {
  const [activeTab, setActiveTab] = useState<MenuTab>('food')
  const foodTab = useRef<HTMLButtonElement>(null)
  const coffeeTab = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const syncTab = () => setActiveTab(tabFromLocation())
    syncTab()
    window.addEventListener('popstate', syncTab)
    return () => window.removeEventListener('popstate', syncTab)
  }, [])

  const selectTab = (tab: MenuTab, updateHistory = true) => {
    setActiveTab(tab)
    if (!updateHistory || typeof window === 'undefined') return

    const url = new URL(window.location.href)
    if (tab === 'coffee') url.searchParams.set('tab', 'coffee')
    else url.searchParams.delete('tab')
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const nextTab: MenuTab = activeTab === 'food' ? 'coffee' : 'food'
    selectTab(nextTab)
    ;(nextTab === 'food' ? foodTab : coffeeTab).current?.focus()
  }

  return (
    <div className="menu-page">
      <header className="menu-page-header section-shell">
        <h1>Our Menu</h1>
      </header>
      <div
        className="menu-tabs section-shell"
        role="tablist"
        aria-label="Choose a menu"
        onKeyDown={handleKeyDown}
      >
        <button
          ref={foodTab}
          id="food-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'food'}
          aria-controls="food-panel"
          tabIndex={activeTab === 'food' ? 0 : -1}
          onClick={() => selectTab('food')}
        >
          Food
        </button>
        <button
          ref={coffeeTab}
          id="coffee-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'coffee'}
          aria-controls="coffee-panel"
          tabIndex={activeTab === 'coffee' ? 0 : -1}
          onClick={() => selectTab('coffee')}
        >
          Coffee
        </button>
      </div>
      <div
        id="food-panel"
        role="tabpanel"
        aria-labelledby="food-tab"
        hidden={activeTab !== 'food'}
      >
        <MenuView menu={menu} embedded />
      </div>
      <div
        id="coffee-panel"
        role="tabpanel"
        aria-labelledby="coffee-tab"
        hidden={activeTab !== 'coffee'}
      >
        <CoffeeView coffees={coffees} embedded />
      </div>
    </div>
  )
}
