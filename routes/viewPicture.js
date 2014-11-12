var fs = require('fs');

module.exports.get = function(req, res) {
	var picPath = './public/images/upload';
	fs.readdir(picPath, function(err, files) {
		if (err) {
			console.log('Files Reading Error');
			res.redirect('/');
		}
		console.log(files);
		res.render('blogviewpic', {
			title: '图片墙',
			user: req.session.user,
			files: files,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
}