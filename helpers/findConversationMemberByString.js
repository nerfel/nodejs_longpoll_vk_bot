module.exports = async function(users, searchString) {
    let user = users.find( u => `${u.first_name} ${u.last_name}` === searchString)
    if (user === undefined) {
        return { success: false, message: 'Пользователь не найден' }
    }

    return { success: true, user }
}