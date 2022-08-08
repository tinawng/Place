function getCookie(name) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null
}
function numberClamp(num, min, max) {
    return Math.min(Math.max(num, min), max)
}

export { getCookie, numberClamp }