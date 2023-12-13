export function formatDate(isoDate: string): string {
    const date = new Date(isoDate)
    const now = new Date()
    if (date.getFullYear() == now.getFullYear()) {
        return date.toLocaleTimeString('en-gb', {
            'hour': "numeric",
            'minute': '2-digit'
        }) + ', ' + date.toLocaleDateString('en-gb', {
            month: 'short',
            day: 'numeric'
        })
    } else {
        return date.toLocaleTimeString('en-gb', {
            'hour': "numeric",
            'minute': '2-digit'
        }) + ', ' + date.toLocaleDateString('en-gb', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }
}