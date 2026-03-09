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
	// ─── Packages (real WTF! Samgyupsal pricing) ─────────────────────────────
	{ id: 'pkg-pork',    name: 'Pork Unlimited',          category: 'packages', price: 399,  childPrice: 350, isWeightBased: false, available: true, desc: 'Unlimited pork samgyupsal grill', perks: 'Unlimited sides, rice, soup', meats: ['meat-samgyup', 'meat-pork-sliced'], autoSides: ['side-kimchi', 'side-rice', 'side-cheese', 'side-lettuce', 'side-egg', 'side-cucumber', 'side-chinese-cabbage', 'side-pork-bulgogi', 'side-fish-cake'], scaledAutoSides: ['side-tea-pitcher'], image: '/images/menu/samgyupsal.jpg', updatedAt: new Date().toISOString() },
	{ id: 'pkg-combo',   name: 'Beef + Pork Unlimited',   category: 'packages', price: 499,  childPrice: 550, isWeightBased: false, available: true, desc: 'Unlimited Premium USDA Beef + Pork', perks: 'Unlimited sides, rice, soup', meats: ['meat-samgyup', 'meat-pork-sliced', 'meat-beef', 'meat-beef-sliced'], autoSides: ['side-kimchi', 'side-rice', 'side-cheese', 'side-lettuce', 'side-egg', 'side-cucumber', 'side-chinese-cabbage', 'side-pork-bulgogi', 'side-fish-cake'], scaledAutoSides: ['side-tea-pitcher'], image: '/images/menu/korean-bbq-seoul.jpg', updatedAt: new Date().toISOString() },
	{ id: 'pkg-beef',    name: 'Beef Unlimited',           category: 'packages', price: 599,  childPrice: 450, isWeightBased: false, available: true, desc: 'Unlimited Premium USDA Beef', perks: 'Unlimited sides, rice, soup', meats: ['meat-beef', 'meat-beef-sliced'], autoSides: ['side-kimchi', 'side-rice', 'side-cheese', 'side-lettuce', 'side-egg', 'side-cucumber', 'side-chinese-cabbage', 'side-pork-bulgogi', 'side-fish-cake'], scaledAutoSides: ['side-tea-pitcher'], image: '/images/menu/bulgogi.jpg', updatedAt: new Date().toISOString() },

	// ─── Meats (kitchen/KDS tracking — weight-based refills) ─────────────────
	{ id: 'meat-samgyup',     name: 'Samgyupsal',          category: 'meats', protein: 'pork', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.65, image: '/images/menu/samgyupsal.jpg', updatedAt: new Date().toISOString() },
	{ id: 'meat-pork-sliced', name: 'Pork Sliced',         category: 'meats', protein: 'pork', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.70, image: '/images/menu/pork-sliced.jpg', updatedAt: new Date().toISOString() },
	{ id: 'meat-beef',        name: 'Premium USDA Beef',   category: 'meats', protein: 'beef', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 1.20, image: '/images/menu/beef-belly.jpg', updatedAt: new Date().toISOString() },
	{ id: 'meat-beef-sliced', name: 'Sliced Beef',         category: 'meats', protein: 'beef', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 1.10, image: '/images/menu/beef-sliced.jpg', updatedAt: new Date().toISOString() },

	// ─── Sides (unlimited with package) ──────────────────────────────────────
	{ id: 'side-tea-pitcher', name: 'Iced Tea Pitcher', category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-kimchi',           name: 'Kimchi',            category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, image: '/images/menu/kimchi.jpg', updatedAt: new Date().toISOString() },
	{ id: 'side-rice',             name: 'Rice',              category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, image: '/images/menu/rice.jpg', updatedAt: new Date().toISOString() },
	{ id: 'side-cheese',           name: 'Cheese',            category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-lettuce',          name: 'Lettuce',           category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-egg',              name: 'Egg',               category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-cucumber',         name: 'Cucumber',          category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-chinese-cabbage',  name: 'Chinese Cabbage',   category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-pork-bulgogi',     name: 'Pork Bulgogi',      category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-fish-cake',        name: 'Fish Cake',         category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-soup-filipino',    name: 'Soup (Filipino)',   category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-soup-pork-rib',    name: 'Pork Rib Soup',    category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },
	{ id: 'side-soup-kimchi-jjigae', name: 'Kimchi Jjigae',  category: 'sides', price: 0, isWeightBased: false, available: true, isFree: true, updatedAt: new Date().toISOString() },

	// ─── Ala Carte Dishes ────────────────────────────────────────────────────
	{ id: 'dish-tteokbokki',    name: 'Tteokbokki',        category: 'dishes', price: 149, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-choi-bhat',     name: 'Choi-Bhat',         category: 'dishes', price: 129, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-ramyun',        name: 'Ramyun',            category: 'dishes', price: 149, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-mandu',         name: 'Mandu',             category: 'dishes', price: 129, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-japchae',       name: 'Japchae',           category: 'dishes', price: 129, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-gyeran-mari',   name: 'Gyeran Mari',       category: 'dishes', price: 119, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-kimbap',        name: 'Kimbap',            category: 'dishes', price: 149, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-bibimbap',      name: 'Bibimbap',          category: 'dishes', price: 169, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-beef-fried-rice',   name: 'Beef Fried Rice',   category: 'dishes', price: 169, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-shrimp-fried-rice', name: 'Shrimp Fried Rice', category: 'dishes', price: 169, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },
	{ id: 'dish-chibop',        name: 'Chibop',            category: 'dishes', price: 149, isWeightBased: false, available: true, updatedAt: new Date().toISOString() },

	// ─── Drinks ──────────────────────────────────────────────────────────────
	{ id: 'drink-soju',  name: 'Soju (Original)',       category: 'drinks', price: 95,  isWeightBased: false, available: true, image: '/images/menu/soju.jpg', updatedAt: new Date().toISOString() },
	{ id: 'drink-beer',  name: 'San Miguel Beer',       category: 'drinks', price: 75,  isWeightBased: false, available: true, image: '/images/menu/san-miguel.jpg', updatedAt: new Date().toISOString() },
	{ id: 'drink-tea',   name: 'Iced Tea',              category: 'drinks', price: 65,  isWeightBased: false, available: true, image: '/images/menu/iced-tea.jpg', updatedAt: new Date().toISOString() },
	{ id: 'ret-123456',  name: 'Bottled Water',         category: 'drinks', price: 40,  isWeightBased: false, available: true, isRetail: true, image: '/images/menu/bottled-water.jpg', updatedAt: new Date().toISOString() },
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
