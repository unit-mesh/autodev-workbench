const nextConfig = {
	trailingSlash: false,
	assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
	output: 'export',
}

module.exports = nextConfig
