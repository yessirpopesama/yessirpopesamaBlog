var fs = require('fs');

module.exports.get = function(req, res) {
	res.render('blogupload', {
		title: '文件上传',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
}

module.exports.post = function(req, res) {
	for (var i in req.files) {
		if (req.files[i].size === 0) {
			fs.unlinkSync(req.files[i].path);
			console.log('Successfully remove a file');
		} else {
			// 上传targetPath位置 
			var targetPath = './public/images/upload/';
			// 读取共有多少文件
			var totalFileNumber = fs.readdirSync(targetPath).length;
			// 截取文件后缀
			var pathArray = req.files[i].path.split('.');
			var fileType = pathArray[pathArray.length - 1];
			// 文件重新定位
			targetPath = './public/images/upload/' + 'blog-' + (totalFileNumber + 1) + '.' + fileType;
			fs.renameSync(req.files[i].path, targetPath);
			console.log(totalFileNumber);
			console.log('Successfully upload a file');
		}
	}
	req.flash('success', '文件上传成功');
	// 重定向到图片强
	return res.redirect('/viewpic');
}