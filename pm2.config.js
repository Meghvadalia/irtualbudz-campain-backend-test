module.exports = {
	apps: [
		{
			name: 'monarc-backend',
			script: 'node --experimental-loader newrelic/esm-loader.mjs -r newrelic dist/main.js',
			instances: 'max',
			exec_mode: 'cluster',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'production',
			},
		},
	],
};
