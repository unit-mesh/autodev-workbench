const nextConfig = {
	trailingSlash: false,
	assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
	serverExternalPackages: ["nodejieba"],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// webpack: (config: any, context: any) => {
	// 	if (context.isServer) {
	// 		config.externals = [
	// 			...config.externals,
	// 			{'nodejieba': 'commonjs nodejieba'},
	// 		]
	// 	}
	// 	return config;
	// },
}

module.exports = nextConfig
