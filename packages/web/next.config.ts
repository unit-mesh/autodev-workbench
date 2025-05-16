const nextConfig = {
	trailingSlash: false,
	assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
	serverExternalPackages: ["nodejieba"],
	images: {
		domains: ['avatars.githubusercontent.com'],
	}
}

module.exports = nextConfig
