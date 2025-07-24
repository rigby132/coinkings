<script>
	import '../app.css';

	/** @type {{children: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<div class="app">
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		background-color: lightgray;
		height: 100%;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
		padding-left: 1rem;
	}
</style>
