/**
 * POS Menu Items — State and CRUD operations.
 */
import type { MenuItem } from '$lib/types';
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { getDb } from '$lib/db';
import { browser } from '$app/environment';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
	// ─── Packages ────────────────────────────────────────────────────────────
	// Samgyeopsal grill — Wikipedia "Samgyeopsal"
	{ id: 'pkg-pork',    name: '🐷 Unli Pork',         category: 'packages', price: 499,  isWeightBased: false, available: true, desc: 'All-you-can-eat pork grill',    perks: '4 sides, 200g initial meats', meats: ['meat-samgyup', 'meat-chadol', 'meat-pork-sliced'], autoSides: ['side-kimchi', 'side-rice'], image: '/images/menu/samgyupsal.jpg', updatedAt: new Date().toISOString() },
	// Bulgogi (beef grill) — Wikipedia "Bulgogi"
	{ id: 'pkg-beef',    name: '🐄 Unli Beef',         category: 'packages', price: 699,  isWeightBased: false, available: true, desc: 'All-you-can-eat beef grill',    perks: '5 sides, 250g initial meats', meats: ['meat-galbi', 'meat-beef', 'meat-beef-sliced'], autoSides: ['side-kimchi', 'side-rice'], image: '/images/menu/bulgogi.jpg', updatedAt: new Date().toISOString() },
	// Korean BBQ spread — Wikipedia "Korean barbecue"
	{ id: 'pkg-combo',   name: '🔥 Unli Pork & Beef',  category: 'packages', price: 899,  isWeightBased: false, available: true, desc: 'Premium pork + beef combo',    perks: '6 sides, 300g initial meats', meats: ['meat-samgyup', 'meat-chadol', 'meat-pork-sliced', 'meat-galbi', 'meat-beef', 'meat-beef-sliced'], autoSides: ['side-kimchi', 'side-rice'], image: '/images/menu/korean-bbq-seoul.jpg', updatedAt: new Date().toISOString() },
	// ─── Meats ───────────────────────────────────────────────────────────────
	// Samgyeopsal grilling — Wikipedia "Samgyeopsal"
	{ id: 'meat-samgyup',     name: 'Samgyupsal',          category: 'meats', protein: 'pork', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.65, image: '/images/menu/samgyupsal.jpg', updatedAt: new Date().toISOString() },
	// Thin-sliced beef brisket — Wikipedia "Brisket"
	{ id: 'meat-chadol',      name: 'Chadolbaegi',         category: 'meats', protein: 'pork', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.75, image: '/images/menu/chadolbaegi.jpg', updatedAt: new Date().toISOString() },
	// Pork belly — Wikipedia "Pork belly"
	{ id: 'meat-pork-sliced', name: 'Pork Sliced',         category: 'meats', protein: 'pork', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.70, image: '/images/menu/pork-sliced.jpg', updatedAt: new Date().toISOString() },
	// Galbi — Wikipedia "Galbi"
	{ id: 'meat-galbi',       name: 'Galbi',               category: 'meats', protein: 'beef', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.90, image: '/images/menu/galbi.jpg', updatedAt: new Date().toISOString() },
	// Galbisal (beef belly cut) — Wikimedia Commons "Korean BBQ-Galbisal"
	{ id: 'meat-beef',        name: 'US Beef Belly',       category: 'meats', protein: 'beef', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 1.20, image: '/images/menu/beef-belly.jpg', updatedAt: new Date().toISOString() },
	// Fresh-cut beef — Wikimedia Commons "Korean BBQ-freshcut"
	{ id: 'meat-beef-sliced', name: 'Beef Sliced',         category: 'meats', protein: 'beef', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 1.10, image: '/images/menu/beef-sliced.jpg', updatedAt: new Date().toISOString() },
	// ─── Sides ───────────────────────────────────────────────────────────────
	// Various kimchi — Wikipedia "Kimchi"
	{ id: 'side-kimchi', name: 'Kimchi',                category: 'sides',    price: 0,    isWeightBased: false, available: true, isFree: true, image: '/images/menu/kimchi.jpg', updatedAt: new Date().toISOString() },
	// Japchae — Wikipedia "Japchae"
	{ id: 'side-japchae',name: 'Japchae',               category: 'sides',    price: 120,  isWeightBased: false, available: true, image: '/images/menu/japchae.jpg', updatedAt: new Date().toISOString() },
	// Steamed rice — Wikipedia "Cooked rice"
	{ id: 'side-rice',   name: 'Steamed Rice',          category: 'sides',    price: 35,   isWeightBased: false, available: true, image: '/images/menu/rice.jpg', updatedAt: new Date().toISOString() },
	// ─── Dishes ──────────────────────────────────────────────────────────────
	// Doenjang jjigae — Wikipedia "Doenjang-jjigae"
	{ id: 'dish-jjigae', name: 'Doenjang Jjigae',       category: 'dishes',   price: 120,  isWeightBased: false, available: true, image: '/images/menu/doenjang-jjigae.jpg', updatedAt: new Date().toISOString() },
	// Dolsot bibimbap — Wikipedia "Bibimbap"
	{ id: 'dish-bibim',  name: 'Bibimbap',              category: 'dishes',   price: 150,  isWeightBased: false, available: true, image: '/images/menu/bibimbap.jpg', updatedAt: new Date().toISOString() },
	// ─── Drinks ──────────────────────────────────────────────────────────────
	// Soju — Wikipedia "Soju"
	{ id: 'drink-soju',  name: 'Soju (Original)',       category: 'drinks',   price: 95,   isWeightBased: false, available: true, image: '/images/menu/soju.jpg', updatedAt: new Date().toISOString() },
	// San Miguel Pale Pilsen — Wikipedia "San Miguel Beer"
	{ id: 'drink-beer',  name: 'San Miguel Beer',       category: 'drinks',   price: 75,   isWeightBased: false, available: true, image: '/images/menu/san-miguel.jpg', updatedAt: new Date().toISOString() },
	// Iced tea — Wikipedia "Iced tea"
	{ id: 'drink-tea',   name: 'Iced Tea',              category: 'drinks',   price: 65,   isWeightBased: false, available: true, image: '/images/menu/iced-tea.jpg', updatedAt: new Date().toISOString() },
	// Bottled water — Wikipedia "Bottled water"
	{ id: 'ret-123456',  name: 'Bottled Water',         category: 'drinks',   price: 40,   isWeightBased: false, available: true, isRetail: true, image: '/images/menu/bottled-water.jpg', updatedAt: new Date().toISOString() }
];

const _menuItems = createRxStore<MenuItem>('menu_items', db => db.menu_items.find());

export const menuItems = {
	get value(): MenuItem[] {
		return _menuItems.value;
	}
};

// ─── Menu CRUD (owner/admin only) ────────────────────────────────────────────

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
	if (!browser) return '';
	const id = `menu-${nanoid(8)}`;
	const db = await getDb();
	await db.menu_items.insert({ ...item, id, updatedAt: new Date().toISOString() });
	log.menuItemCreated(item.name, item.category);
	return id;
}

export async function updateMenuItem(id: string, updates: Partial<Omit<MenuItem, 'id'>>): Promise<void> {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.menu_items.findOne(id).exec();
	if (!doc) return;
	const oldName = doc.name;
	await doc.incrementalPatch({ ...updates, updatedAt: new Date().toISOString() });
	log.menuItemUpdated(oldName, Object.keys(updates).join(', '));
}

export async function deleteMenuItem(id: string): Promise<void> {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.menu_items.findOne(id).exec();
	if (!doc) return;
	const name = doc.name;
	await doc.remove();
	log.menuItemDeleted(name);
}

export async function toggleMenuItemAvailability(id: string): Promise<void> {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.menu_items.findOne(id).exec();
	if (!doc) return;
	const newAvailable = !doc.available;
	await doc.incrementalPatch({ available: newAvailable, updatedAt: new Date().toISOString() });
	log.menuItemToggled(doc.name, newAvailable);
}
