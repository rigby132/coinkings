<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import L, { Icon } from 'leaflet';
	import { icons, iconColors, blackIcon, iconUrls, shadowUrl, redIcon } from './marker';

	const findspots: { [key: ElementId]: Findspot } = $state({});
	let minCoins = $state(1);

	const coins: { [key: ElementId]: Coin[] } = {};

	let selectedMetric = $state('distance');
	const metrics = [
		{ name: 'Geographische Distanz', value: 'distance' },
		{ name: 'Visuelle Ähnlichkeit', value: 'similarity' },
		{ name: 'Allen', value: 'allen' },
		{ name: 'Kellner', value: 'kellner' },
		{ name: 'Nick', value: 'nick' },
		{ name: 'OCC', value: 'occ' },
		{ name: 'Ziegaus', value: 'ziegaus' }
	];

	const occTypes = ['bse1', 'bs1', 'bs2', 'bs3', 'bs4', 'bs5', 'bs6', 'bs7', 'bs8', 'bs9'];
	const occYears: [number, number][] = [
		[Number.NEGATIVE_INFINITY, -135],
		[Number.NEGATIVE_INFINITY, -135],
		[Number.NEGATIVE_INFINITY, -135],
		[-135, -50],
		[-100, -50],
		[-75, -25],
		[-100, -25],
		[-75, -25],
		[-75, -25],
		[-75, -25]
	];
	let startingYear = $state(-135);
	let endingYear = $state(0);
	$effect(() => {
		if (startingYear >= endingYear) {
			endingYear = startingYear;
		}
	});
	let useAllOCCs = $state(true);
	let selectedOCCs = $derived(
		occYears
			.map((years, i) => (startingYear > years[1] || endingYear < years[0] ? null : occTypes[i]))
			.filter((value) => value != null)
	);

	let edges: Edge[] = [];
	let minWeight = $state(0);

	let map: L.Map;
	const base_zoom = 8;

	const clusterSizes: number[] = $derived(
		[...iconColors.keys()].map((cluster) => {
			let count = 0;
			for (let [elementId, spot] of Object.entries(findspots)) {
				if (cluster == spot.cluster) count++;
			}
			return count;
		})
	);
	let selectedCluster = $state(-1);
	let startCoordinate: L.LatLng;
	let selectionBox: L.Rectangle;

	// filter findspots
	$effect(() => {
		for (let spot of Object.values(findspots)) {
			if (spot.numCoins >= minCoins) {
				spot.marker.addTo(map);
				spot.isActive = true;
			} else {
				spot.marker.remove();
				spot.isActive = false;
			}
		}
		edges.forEach((edge) => {
			edge.line.setStyle({
				color: iconColors[findspots[edge.startId].cluster],
				weight: edge.weight,
				opacity: findspots[edge.startId].isActive && findspots[edge.endId].isActive ? 1.0 : 0
			});
		});
	});

	// API

	async function queryFindspots() {
		console.log(`Querying all findspots.`);
		try {
			const response = await fetch(`/findspots`);

			const data = await response.json();
			let findspots = data.map(
				([findspot, numCoins]: [
					{
						elementId: ElementId;
						properties: { name: string; coordinates: number[] };
					},
					number
				]) => {
					return {
						elementId: findspot.elementId,
						name: findspot.properties.name,

						coordinates: L.latLng(
							findspot.properties.coordinates[0],
							findspot.properties.coordinates[1]
						),
						numCoins: numCoins
					};
				}
			);

			return findspots;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryCoins(findspot_id: ElementId) {
		console.log(`Querying coins from ${findspots[findspot_id].name}.`);
		try {
			const params = new URLSearchParams();
			params.append('findspot', findspot_id);
			const response = await fetch(`/coins?${params.toString()}`);

			const data = await response.json();
			const coins = data.map(
				(coin: {
					elementId: ElementId;
					properties: {
						id: string;
						collection: string;
						diameter: string;
						weight: string;
						remark: string;
						inventory: string;
					};
				}) => {
					return {
						elementId: coin.elementId,
						id: coin.properties.id,
						collection: coin.properties.collection,
						diameter: coin.properties.diameter,
						weight: coin.properties.weight,
						remark: coin.properties.remark,
						inventory: coin.properties.inventory
					};
				}
			);

			return coins;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function querySimilarityEdges() {
		console.log('Querying similarity edges');
		try {
			const response = await fetch(`/similarity`);
			const edges = await response.json();

			return edges;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryClassEdges(coinClass: string) {
		console.log(`Querying ${coinClass} class edges`);
		try {
			const params = new URLSearchParams();
			params.append('class', coinClass);
			const response = await fetch(`/class?${params.toString()}`);
			const edges = await response.json();

			return edges;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryOCCEdges(occTypes: string[]) {
		console.log(`Querying ${occTypes} OCC type edges`);
		try {
			const params = new URLSearchParams();
			params.append('types', occTypes.toString());
			const response = await fetch(`/occ?${params.toString()}`);
			const edges = await response.json();

			return edges;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryClusterDistance(samples: number = 10) {
		console.log(`Querying clustering based on distance.`);
		try {
			const params = new URLSearchParams();
			params.append('samples', samples.toString());
			const response = await fetch(`/distance/cluster?${params.toString()}`);
			const clustering = await response.json();

			return clustering;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryClusterSimilarity(minClusterSize: number = 0) {
		console.log(`Querying clustering based on visual similarity.`);
		try {
			const params = new URLSearchParams();
			params.append('minSize', minClusterSize.toString());
			const response = await fetch(`/similarity/cluster?${params.toString()}`);
			const clustering = await response.json();

			return clustering;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryClusterSharedTypes(coinClass: string) {
		console.log(`Querying clustering based on shared ${coinClass} types.`);
		try {
			const params = new URLSearchParams();
			params.append('coinClass', coinClass);
			const response = await fetch(`/class/cluster?${params.toString()}`);
			const clustering = await response.json();

			return clustering;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryClusterSharedOCCTypes(occTypes: string[]) {
		console.log(`Querying clustering based on shared ${occTypes} types.`);
		try {
			const params = new URLSearchParams();
			params.append('occTypes', occTypes.toString());
			const response = await fetch(`/occ/cluster?${params.toString()}`);
			const clustering = await response.json();

			return clustering;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryMetricSimilarity(clustering: [ElementId, number][]) {
		console.log(`Querying cluster metric based on visual similarity.`);
		try {
			const params = new URLSearchParams();
			params.append('clustering', JSON.stringify(clustering));
			const response = await fetch(`/similarity/metric?${params.toString()}`);
			const metric = await response.json();

			return metric;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryMetricSharedTypes(clustering: [ElementId, number][], coinClass: string) {
		console.log(`Querying cluster metric based on shared ${coinClass} types.`);
		try {
			console.log(clustering);
			const params = new URLSearchParams();
			params.append('coinClass', coinClass);
			params.append('clustering', JSON.stringify(clustering));
			const response = await fetch(`/class/metric?${params.toString()}`);
			const metric = await response.json();

			console.log(metric);

			return metric;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async function queryMetricSharedOCCTypes(clustering: [ElementId, number][], occTypes: string[]) {
		console.log(`Querying cluster metric based on shared ${occTypes} types.`);
		try {
			console.log(clustering);
			const params = new URLSearchParams();
			params.append('occTypes', occTypes.toString());
			params.append('clustering', JSON.stringify(clustering));
			const response = await fetch(`/occ/metric?${params.toString()}`);
			const metric = await response.json();

			console.log(metric);

			return metric;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	// Map helpers

	function startSelection(e: L.LeafletMouseEvent) {
		if (e.originalEvent.button != 0) return; // only left mouse button

		map.dragging.disable();
		if (selectionBox) {
			selectionBox.remove();
		}
		startCoordinate = map.mouseEventToLatLng(e.originalEvent);
		selectionBox = L.rectangle(
			L.latLngBounds([startCoordinate, map.mouseEventToLatLng(e.originalEvent)]),
			{ color: iconColors[selectedCluster] }
		).addTo(map);
	}

	function moveSelection(e: L.LeafletMouseEvent) {
		if (e.originalEvent.button != 0) return; // only left mouse button
		if (selectionBox) {
			const point = map.mouseEventToLayerPoint(e.originalEvent);
			selectionBox.setBounds(
				L.latLngBounds([startCoordinate, map.mouseEventToLatLng(e.originalEvent)])
			);
		}
	}

	function endSelection(e: L.LeafletMouseEvent) {
		if (e.originalEvent.button != 0) return; // only left mouse button
		map.dragging.enable();

		if (selectionBox) {
			for (let [elementId, spot] of Object.entries(findspots)) {
				if (
					selectionBox.getBounds().contains(spot.marker.getLatLng()) &&
					selectedCluster >= 0 &&
					spot.isActive
				) {
					spot.cluster = selectedCluster;
					spot.marker.setIcon(createScaledIcon(selectedCluster, spot.numCoins));
				}
			}

			selectionBox.remove();
		}
	}

	function setClusterForSelection(cluster: number) {
		if (cluster == selectedCluster) return;

		selectedCluster = cluster;

		if (selectedCluster == -1) {
			map.off('mousedown', startSelection);
			map.off('mousemove', moveSelection);
			map.off('mouseup', endSelection);
		} else {
			map.on('mousedown', startSelection);
			map.on('mousemove', moveSelection);
			map.on('mouseup', endSelection);
		}
	}

	function createScaledIcon(index: number, count: number) {
		const minScale = 0.8;
		const maxScale = 1.5;

		const percentage = Math.max(0.0, Math.min(count / 50.0, 1.0));

		const scale = minScale + (maxScale - minScale) * percentage;

		return new L.Icon({
			iconUrl: iconUrls[index],
			shadowUrl: shadowUrl,
			iconSize: [25 * scale, 41 * scale],
			iconAnchor: [12 * scale, 41 * scale],
			popupAnchor: [1 * scale, -34 * scale],
			shadowSize: [41 * scale, 41 * scale]
		});
	}

	let calculatedMetric: [number, number][] = $state([]);

	// Helpers

	let clusterBox: any;
	function scrollToEnd() {
		if (clusterBox) {
			clusterBox.scrollTo({ top: clusterBox.scrollHeight, behavior: 'smooth' });
		}
	}

	// Clustering
	async function requestClustering() {
		let response: any = null;

		switch (selectedMetric) {
			case 'distance':
				response = await queryClusterDistance(100);
				break;
			case 'similarity':
				response = await queryClusterSimilarity();
				break;
			case 'allen':
			case 'kellner':
			case 'nick':
			case 'ziegaus':
				response = await queryClusterSharedTypes(selectedMetric);
				break;
			case 'occ':
				if (useAllOCCs) {
					response = await queryClusterSharedTypes(selectedMetric);
				} else {
					response = await queryClusterSharedOCCTypes(selectedOCCs);
				}
				break;
		}

		if (response != null && Array.isArray(response)) {
			response.forEach((assignment: { elementId: string; cluster: number }) => {
				const id = assignment.elementId;
				if (assignment.cluster < icons.length) {
					findspots[id].cluster = assignment.cluster;
					findspots[id].marker.setIcon(
						createScaledIcon(assignment.cluster, findspots[id].numCoins)
					);
				} else {
					// not enough icons to display
					findspots[id].cluster = 0;
					findspots[id].marker.setIcon(createScaledIcon(0, findspots[id].numCoins));
				}
			});
		}
		setTimeout(() => {
			scrollToEnd();
		}, 10);
	}

	// Metric
	async function requestMetric() {
		let clustering: [ElementId, number][] = [];
		let response: any = null;
		const findspotKeys = Object.keys(findspots);
		for (let i = 0; i < findspotKeys.length; i++) {
			let keyToPush = findspotKeys[i];
			let clusterToPush = findspots[keyToPush].cluster;
			clustering.push([keyToPush, clusterToPush]);
		}

		switch (selectedMetric) {
			case 'distance':
				response = [];
				break;
			case 'similarity':
				response = await queryMetricSimilarity(clustering);
				break;
			case 'allen':
			case 'kellner':
			case 'nick':
			case 'ziegaus':
				response = await queryMetricSharedTypes(clustering, selectedMetric);
				break;
			case 'occ':
				if (useAllOCCs) {
					response = await queryMetricSharedTypes(clustering, selectedMetric);
				} else {
					response = await queryMetricSharedOCCTypes(clustering, selectedOCCs);
				}
				break;
		}

		calculatedMetric = [];
		response.forEach((assignment: { cluster: { low: number }; modularity: number }) => {
			calculatedMetric.push([assignment.cluster.low, assignment.modularity]);
		});
	}

	async function requestEdges() {
		let response: [ElementId, ElementId, number][] = [];
		let scaling = 1.0;
		let newEdges: Edge[] = [];

		switch (selectedMetric) {
			case 'similarity':
				response = await querySimilarityEdges();
				scaling = 0.001;
				break;
			case 'allen':
			case 'kellner':
			case 'nick':
			case 'ziegaus':
				response = await queryClassEdges(selectedMetric);
				scaling = 0.1;
				break;
			case 'occ':
				if (useAllOCCs) {
					response = await queryClassEdges(selectedMetric);
					scaling = 0.1;
				} else {
					response = await queryOCCEdges(selectedOCCs);
					scaling = 0.1;
				}
				break;
		}

		Object.values(edges).forEach((edge) => {
			edge.line.remove();
		});

		response.forEach(([id0, id1, weight]) => {
			const sortedId = [id0, id1].sort();
			const edgeId = sortedId[0] + sortedId[1];

			let color = iconColors[findspots[id0].cluster];

			const line = new L.Polyline([findspots[id0].coordinates, findspots[id1].coordinates], {
				color: color,
				weight: weight * scaling,
				opacity: findspots[id0].isActive && findspots[id1].isActive && (weight * scaling >= minWeight) ? 1.0 : 0
			}).addTo(map);

			newEdges.push({
				startId: sortedId[0],
				endId: sortedId[1],
				line: line,
				weight: weight * scaling
			});
		});
		edges = newEdges;
	}

	function updateEdges() {
		edges.forEach((edge) => {
			edge.line.setStyle({
				color: iconColors[findspots[edge.startId].cluster],
				weight: edge.weight,
				opacity: findspots[edge.startId].isActive && findspots[edge.endId].isActive && edge.weight >= minWeight ? 1.0 : 0
			});
		});
	}

	async function animateOCC() {
		const years = [
			-135, -130, -125, -120, -115, -110, -105, -100, -95, -90, -85, -80, -75, -70, -65, -60, -55,
			-50, -45, -40, -35, -30, -25
		];

		useAllOCCs = false;
		for (let i = 0; i < years.length; i++) {
			startingYear = years[i];
			endingYear = years[i];
			requestEdges();
			await new Promise((r) => setTimeout(r, 1000));
		}
	}

	onMount(async () => {
		const findspotList = queryFindspots();

		map = L.map('map', { zoomControl: false }).setView([48.5, 10], base_zoom);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			minZoom: 6,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);

		(await findspotList).forEach((spot: Findspot) => {
			findspots[spot.elementId] = spot;
		});

		for (let [elementId, spot] of Object.entries(findspots)) {
			spot.marker = L.marker(spot.coordinates, {
				title: spot.name,
				alt: spot.elementId,
				icon: createScaledIcon(0, spot.numCoins)
			})
				.addTo(map)
				.bindPopup(`${spot.name}: ${spot.numCoins}🪙`);
			spot.cluster = 0;
		}
	});
</script>

<svelte:head>
	<title>Coinkings</title>
	<meta name="description" content="Numismatic analysis tool" />
</svelte:head>

<div id="content">
	<div id="side">
		<div id="metrics" class="side-container">
			<div>
				<label for="min-coins">Minimum 🪙:</label>
				<input type="range" name="min-coins" min="1" max="100" bind:value={minCoins} step="1" />
				{minCoins}
			</div>
			<div>
				<label for="min-coins">Metrik:</label>
				<select
					name="metric-select"
					style="font-size: inherit; font-family: inherit;"
					onchange={(event: any) => {
						selectedMetric = event.target.value;
						requestEdges();
					}}
				>
					<option selected disabled value="">Metrik wählen</option>
					{#each metrics as metric}
						<option value={metric.value}>{metric.name}</option>
					{/each}
				</select>
			</div>
			<div style="display:flex;">
				<label for="min-weight">Minimum Gewicht:</label>
				<input
					type="range"
					name="min-weight"
					min="0"
					max="10.0"
					bind:value={minWeight}
					step="0.1"
					onchange={updateEdges}
				/>
				{minWeight}
			</div>
			<div style="display:flex; justify-content: space-evenly; flex-direction: column;">
				{#if selectedMetric == 'occ'}
					<span style="display:flex;">
						<input type="checkbox" bind:checked={useAllOCCs} onchange={requestEdges} />
						<label for="useAllOCC">Alle OCC Typen verwenden</label>
					</span>
					<button onclick={animateOCC}>Jahre durchlaufen</button>
					<label for="minYear">Zeitspanne (in Jahren): {startingYear} bis {endingYear}</label>
					<input
						type="range"
						name="minYear"
						min="-135"
						max="-25"
						bind:value={startingYear}
						step="5"
						onchange={requestEdges}
					/>
					<input
						type="range"
						name="maxYear"
						min="-135"
						max="-25"
						bind:value={endingYear}
						step="5"
						onchange={requestEdges}
					/>
					OCC Typen: {selectedOCCs.toString()}
				{/if}
			</div>
			<div style="flex: 1;"></div>
			<button
				class="add"
				style="width: 100%; "
				onclick={async () => {
					setClusterForSelection(-1);
					await requestClustering();
					updateEdges();
				}}
				>Auto Clustering
			</button>
		</div>

		<div id="clustering" class="side-container">
			<ul
				style="list-style-type: none; height:100%; padding: 5px; margin: 0; overflow-y: scroll;"
				bind:this={clusterBox}
			>
				{#each clusterSizes as clusterSize, cluster}
					{#if clusterSize > 0 || cluster == 0 || selectedCluster == cluster}
						<li style="margin-bottom: 10px;">
							<div class="cluster">
								<div style="display:flex;">
									<div style="background-color: {iconColors[cluster]}; width: 20px; height: 20px;">
										&nbsp;
									</div>
									&nbsp;&nbsp;{cluster}: {clusterSize}📍
								</div>
								<div>
									{#if selectedCluster != cluster}
										<button style="height: 100%" onclick={() => setClusterForSelection(cluster)}
											>Hinzufügen</button
										>
									{:else}
										<button
											class="add"
											style="background-color: #f7d2c4; box-shadow: 0px 5px 10px rgba(0,0,0,0.1); border-radius: 5px;"
											onclick={() => {
												setClusterForSelection(-1);
											}}>Hinzufügen</button
										>
									{/if}
									{#if cluster != 0}
										<button
											style="height: 100%"
											onclick={() => {
												for (let [elementId, spot] of Object.entries(findspots)) {
													if (spot.cluster == cluster) {
														spot.cluster = 0;
														spot.marker.setIcon(createScaledIcon(0, spot.numCoins));
													}
												}
												setClusterForSelection(-1);
											}}>🗑</button
										>
									{:else}
										<button style="height: 100%" disabled>🗑</button>
									{/if}
								</div>
							</div>
						</li>
					{/if}
				{/each}
				<button
					id="add-cluster"
					style="width: 100%;"
					onclick={() => {
						clusterSizes.every((clusterSize, index) => {
							if (clusterSize == 0 && index != 0) {
								setClusterForSelection(index);
								return false;
							}
							return true;
						});
						setTimeout(() => {
							scrollToEnd();
						}, 10);
					}}>Neues Cluster</button
				>
			</ul>
		</div>

		<div id="results" class="side-container">
			<div></div>
			{#each calculatedMetric as metric}
				<span style="display:flex;"
					><div
						class="color-square"
						style="background-color: {iconColors[metric[0]]}; width: 20px; height: 20px;"
					></div>
					<div>Cluster {metric[0]}: {metric[1]}</div></span
				>
			{/each}
			<button onclick={requestMetric}>Cluster Score anzeigen</button>
		</div>
	</div>
	<div id="map"></div>
</div>

<style>
	#content {
		display: flex;
		flex-direction: row;
		height: 100%;
	}

	#side {
		position: relative;
		flex: 1;
		display: flex;
		justify-content: space-evenly;
		flex-direction: column;
		align-items: center;
		padding-right: 10px;
	}

	#map {
		position: relative;
		min-height: 400px;
		flex: 5;
	}


	.side-container {
		position: relative;
		width: 100%;
		height: 32%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		border-style: groove;
	}

	.cluster {
		background-color: #f7f7f7; /* Light gray background for the item container */
		border-radius: 5px;
		padding: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
	}
</style>
