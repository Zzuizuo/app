Component({
	properties: {
		background: {
			type: String,
			value: 'rgba(255, 255, 255, 1)'
		}
	},
	attached: function() {
		var that = this;
		that.setNavSize();
	},
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	data: {},
	methods: {
		// 通过获取系统信息计算导航栏高度
		setNavSize: function() {
			let that = this,
				sysinfo = wx.getSystemInfoSync(),
				statusHeight = sysinfo.statusBarHeight,
				isiOS = sysinfo.system.indexOf('iOS') > -1,
				navHeight;
			if (!isiOS) {
				navHeight = 48;
			} else {
				navHeight = 44;
			}
			that.setData({
				status: statusHeight,
				navHeight: navHeight
			});
		}
	}
});
