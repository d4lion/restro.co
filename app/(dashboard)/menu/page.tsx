import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { menuRepository } from "@/lib/repositories/menu.repository";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Carta" };

async function toggleAvailabilityAction(formData: FormData) {
  "use server";
  const itemId = formData.get("itemId") as string;
  if (itemId) {
    await menuRepository.toggleItemAvailability(itemId);
    revalidatePath("/menu");
  }
}

async function addCategoryAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) return;

  const name = formData.get("name") as string;
  if (!name) return;

  const menu = await menuRepository.getFullMenu(session.tenantId);
  if (menu) {
    await menuRepository.createCategory(session.tenantId, menu.id, { name });
    revalidatePath("/menu");
  }
}

async function addItemAction(formData: FormData) {
  "use server";
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const imageUrl = formData.get("imageUrl") as string;

  if (categoryId && name && !isNaN(price)) {
    await menuRepository.createMenuItem(categoryId, {
      name,
      description,
      price,
      imageUrl,
    });
    revalidatePath("/menu");
  }
}

export default async function MenuPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const menu = await menuRepository.getFullMenu(session.tenantId);

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Carta Digital</h1>
          <p className={styles.subtitle}>
            Organiza tus categorías, administra precios e imágenes y controla la disponibilidad instantánea.
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Nueva Categoría</h2>
        <form action={addCategoryAction} className={styles.inlineForm}>
          <Input name="name" placeholder="Nombre de categoría (ej. Entradas, Fuertes, Bebidas)" required />
          <Button type="submit" variant="primary">Crear Categoría</Button>
        </form>
      </div>

      {/* Categories & Products list */}
      {!menu || menu.categories.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Tu carta aún no tiene productos</p>
          <p className={styles.emptySub}>Crea tu primera categoría arriba para empezar a estructurar tu menú.</p>
        </div>
      ) : (
        <div className={styles.categoriesList}>
          {menu.categories.map((category) => (
            <div key={category.id} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <h3 className={styles.categoryName}>
                  {category.name}
                  <span className={styles.itemCount}>({category.items.length} platos)</span>
                </h3>
              </div>

              {/* Items Table */}
              <div className={styles.itemsGrid}>
                {category.items.map((item) => (
                  <div key={item.id} className={`${styles.itemRow} ${!item.isAvailable ? styles["itemRow--disabled"] : ""}`}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemThumb}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} />
                        ) : (
                          <span>Plato</span>
                        )}
                      </div>
                      <div>
                        <strong className={styles.itemName}>{item.name}</strong>
                        {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                        <span className={styles.itemPrice}>{formatCOP(item.price)}</span>
                      </div>
                    </div>

                    <div className={styles.itemActions}>
                      <form action={toggleAvailabilityAction}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          className={`${styles.toggleBtn} ${item.isAvailable ? styles["toggleBtn--on"] : styles["toggleBtn--off"]}`}
                        >
                          {item.isAvailable ? "DISPONIBLE" : "AGOTADO"}
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Add Item Form */}
              <details className={styles.addItemDetails}>
                <summary className={styles.addItemSummary}>+ Agregar plato a {category.name}</summary>
                <form action={addItemAction} className={styles.addItemForm}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <Input name="name" placeholder="Nombre del plato" required />
                  <Input name="price" type="number" placeholder="Precio COP" required />
                  <Input name="imageUrl" placeholder="URL Imagen (opcional)" />
                  <Textarea name="description" placeholder="Descripción de ingredientes / sabor" />
                  <Button type="submit" variant="secondary">Guardar Plato</Button>
                </form>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
