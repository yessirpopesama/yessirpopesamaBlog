module.exports = {
	cookieSecret: 'myblog',
	url: '', // your mongodb url
	hostConfig: {
		host: "", // like smtp.126.com 
		port: 25, // port for secure SMTP
		auth: {
			user: "",
			pass: ""
		}
	},
	targetInfo: {
		from: "",
		to: null,
		subject: "Thank for your resgister",
		text: "Deep Dark Fantasy"
	}
}