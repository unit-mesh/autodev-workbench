const nextConfig = {
	trailingSlash: false,
	assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig
