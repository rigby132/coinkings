// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	type ElementId = string;
	type Findspot = {
		elementId: ElementId;
		name: string;
		coordinates: L.LatLng;
		marker: L.Marker;
		cluster: number;
		numCoins: number;
		isActive: boolean = true;
		isSelected: boolean = false;
	};
	type Coin = {
		elementId: ElementId;
		id: string;
		collection: string;
		diameter: string;
		weight: string;
		remark: string;
		inventory: string;
	};
	type Edge = {
		startId: ElementId,
		endId: ElementId,
		line: L.Polyline,
		weight: number,
	};
}

export { };
