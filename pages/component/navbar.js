Component({
	behaviors: [],
	properties: {
		navs: {
			// 属性名
			type: Array,
			value: []
		},
		active: Number,
		ispadding: {
			type: Boolean,
			value: true
		},
		myProperty2: String // 简化的定义方式
	},
	data: {}, // 私有数据，可用于模板渲染
	lifetimes: {
		// 生命周期函数，可以为函数，或一个在methods段中定义的方法名
		attached: function() {},
		moved: function() {},
		detached: function() {}
	},
	// 生命周期函数，可以为函数，或一个在methods段中定义的方法名
	attached: function() {}, // 此处attached的声明会被lifetimes字段中的声明覆盖
	ready: function() {},
	observers: {
		active(newVal, oldVal) {
			if (newVal != oldVal) {
				this.setData({
					activeIndex: newVal
				});
			}
			// 在 numberA 或者 numberB 被设置时，执行这个函数
		}
	},
	pageLifetimes: {
		// 组件所在页面的生命周期函数
		show: function() {},
		hide: function() {},
		resize: function() {}
	},
	methods: {
		onChangeNavTap(e) {
			let eventDetail = {
				index: e.currentTarget.dataset.index,
				item: e.currentTarget.dataset.item
			};
			this.triggerEvent('ChangeNav', eventDetail);
			wx.vibrateShort();
		},
		// 内部方法建议以下划线开头
		_myPrivateMethod: function() {
			// 这里将 data.A[0].B 设为 'myPrivateData'
			this.setData({
				'A[0].B': 'myPrivateData'
			});
		},
		_propertyChange: function(newVal, oldVal) {}
	}
});
