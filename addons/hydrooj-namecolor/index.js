const { page, UserModel, GroupModel, utils } = require('hydrooj');

module.exports = async () => {
    if (!UserModel.schema.paths.name_color) UserModel.schema.add({ name_color: { type: String, default: '' } });
    if (!GroupModel.schema.paths.name_color) GroupModel.schema.add({ name_color: { type: String, default: '' } });

    // 管理主界面
    page('/admin/namecolor', async (req, res) => {
        if (!req.user || !req.user.is_admin) return res.redirect('/');
        const [users, groups] = await Promise.all([
            UserModel.find({}, { username: 1, _id: 1, name_color: 1 }).sort({ username: 1 }),
            GroupModel.find({}, { name: 1, _id: 1, name_color: 1 }).sort({ name: 1 })
        ]);
        res.render('admin_namecolor', { users, groups });
    });

    // 用户设置
    page.post('/admin/namecolor', async (req, res) => {
        if (!req.user || !req.user.is_admin) return res.redirect('/');
        const query = (req.body.username || '').trim();
        const color = (req.body.color || '').trim();
        if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color))
            return res.render('admin_namecolor', { error: '颜色格式错误', users: await UserModel.find({}) });
        const cond = /^[0-9a-fA-F]{24}$/.test(query) ? { _id: query } : { username: query };
        const user = await UserModel.findOne(cond);
        if (!user)
            return res.render('admin_namecolor', { error: '用户不存在', users: await UserModel.find({}) });
        await UserModel.updateOne({ _id: user._id }, { name_color: color });
        res.render('admin_namecolor', { success: `已将 ${user.username} 的颜色设置为 ${color}`, users: await UserModel.find({}) });
    });

    // 自动补全
    page('/admin/namecolor/search', async (req, res) => {
        if (!req.user || !req.user.is_admin) return res.json([]);
        const key = (req.query.q || '').trim();
        if (!key) return res.json([]);
        const regex = new RegExp(utils.escapeRegExp(key), 'i');
        const results = await UserModel.find({ username: regex }, { username: 1 }).limit(10);
        res.json(results.map(u => ({ id: u._id, username: u.username })));
    });

    // AJAX更新用户颜色
    page.post('/admin/namecolor/update', async (req, res) => {
        if (!req.user || !req.user.is_admin) return res.json({ ok: false, msg: '权限不足' });
        const { id, color } = req.body;
        if (!id || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color))
            return res.json({ ok: false, msg: '数据无效' });
        await UserModel.updateOne({ _id: id }, { name_color: color });
        res.json({ ok: true });
    });

    // AJAX更新用户组颜色
    page.post('/admin/namecolor/updateGroup', async (req, res) => {
        if (!req.user || !req.user.is_admin) return res.json({ ok: false, msg: '权限不足' });
        const { id, color } = req.body;
        if (!id || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color))
            return res.json({ ok: false, msg: '数据无效' });
        await GroupModel.updateOne({ _id: id }, { name_color: color });
        res.json({ ok: true });
    });

    // 渲染用户名颜色（优先用户，其次用户组）
    utils.extend('render_user', (old, user) => {
        const color = user.name_color || (user.groups && user.groups.length && user.groups[0].name_color) || '#000';
        return `<span style="color:${color}">${utils.escapeHTML(user.uname || user.username)}</span>`;
    });

    console.log('[hydro-namecolor] v2.0 已加载（支持用户组颜色批量设置）');
};
