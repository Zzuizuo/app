//Page Object
Page({
	data: {
		url: null
	},
	//options(Object)
	onLoad: function(options) {
		this.setData({
			url: options.url
		});
	},
	onReady: function() {},
	onShow: function() {},
	onHide: function() {},
	onUnload: function() {},
	onPullDownRefresh: function() {},
	onReachBottom: function() {},
	onShareAppMessage: function() {},
	onPageScroll: function() {},
	//item(index,pagePath,text)
	onTabItemTap: function(item) {}
});
