module.exports = minuteNumber => {
    let mod = minuteNumber % 10
    if (minuteNumber > 10 && minuteNumber < 20) {
        return 'минут'
    }

    if (mod === 1) {
        return 'минуту'
    }

    if ([2, 3, 4].includes(mod)) {
        return 'минуты'
    }

    return 'минут'
}