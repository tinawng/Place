class API {
    constructor() {
        this.base_url = ""
    }
    setBaseUrl(url) { this.base_url = url }

    async call(url, options) {
        const response = await fetch(this.base_url + url, options)
        if (response.status >= 400)
            throw await response.text()

        return response
    }

    async get(url) {
        const options = { method: 'GET' }

        return await this.call(url, options)
    }
    async post(url, body) {
        const options = {
            method: 'POST',
            body: JSON.stringify(body)
        }

        return await this.call(url, options)
    }

    async fetchMap() { return (await this.get('map')).arrayBuffer() }
    async fetchColorPalette() { return new Map(Object.entries(await (await this.get('color_palette')).json())) }
    async fetchConnectedClient() { return (await this.get('connected_client')).text() }
    async placePixel(payload) { await this.post('pixel', payload) }
}

export default new API()