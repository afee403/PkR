// components/w-modals-item/index.js
import Notify from '@vant/weapp/notify/notify';
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        medal: {
            type: Object,  //数据类型
            value: null    //默认值
        },
        able: {
          type: Boolean,
          value: true
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        ungetable: true,
        isShowDetail: false,
        data: {}  //用于展示
    },

    /**
     * 生命周期
     */
    attached: function() {
        let that = this;
        //整理传入数据
        that.setData({
            data: that.properties.medal,
            ungetable: that.properties.able
        })
    },

    /**
     * 组件的方法列表
     */
    methods: {
        showDetail: function(){
            this.setData({ isShowDetail:true })
        },
        onClose: function(){
            this.setData({ isShowDetail:false })
        },
        //跳转到徽章页面
        goModal: function(){
          let that = this;
          let user = that.data.user;
          if (that.data.ungetable) {
            wx.showModal({
              title: '提示',
              content: '请先登录',
              success (res) {
                if (res.confirm) {
                  console.log('用户点击确定')
                } else if (res.cancel) {
                  console.log('用户点击取消')
                }
              }
            })
          }
          else {
            wx.navigateTo({
              url: '/pages/user/medals/medals?medal='+JSON.stringify(that.data.data[0].meid),
            })
          }
        }
    }
})
