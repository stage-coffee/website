import type { FoodMenu } from '../lib/contentful'
import RichText from './RichText'

export default function MenuView({ menu }: { menu: FoodMenu | null }) {
  return (
    <div className="menu-page">
      <h1 className="visually-hidden">Food menu</h1>
      <section className="menu-section section-shell" aria-label="Food menu">
        {menu?.content ? (
          <div className="menu-sheet">
            <h2 className="visually-hidden">Food options</h2>
            <div className="menu-content">
              <RichText document={menu.content} />
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h2>Our menu is being updated</h2>
            <p>Please ask the team about today’s food.</p>
          </div>
        )}
      </section>
    </div>
  )
}
