const app = getApp();
const user_info = JSON.parse(wx.getStorageSync('user'));
const medals_All = require('../../../utils/medals_all');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        isShowloading: true,
        medal: [],
        medals_all: [],
        user: {},
        medal_data: ""
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (option) {
        this.setData({ user: user_info});
        this.setData({ medals_all: medals_All });
        this.requestData(this.data.user.rid)
        let medal_meid;
        if (option != null) {
          this.setData({ medal_data: option.medal});
          medal_meid = JSON.parse(option.medal);
          wx.setStorageSync('meid', JSON.stringify(medal_meid));
        }
        else {
          medal_meid = wx.getStorageSync('meid');
        }
        for (let k = 0; k < this.data.medals_all.length; k++) {
          if (this.data.medals_all[k][0].meid == medal_meid) {
            this.setData({medal: this.data.medals_all[k]});
            break;
          }
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },

    //获取个人勋章数据
    requestData(rid) {
        return new Promise((resolve, reject)=>{
            wx.request({
                url: app.config.getHostUrl()+'/api/user/getMedal',
                data: { rid },
                method: 'POST',
                success: (result)=>{
                    if(result.data.isSuccess){
                        resolve(result.data.data);
                    }else{
                        reject(result.data.msg);
                    }
                },
                fail: ()=>{},
                complete: ()=>{}
            });
        })
    },

    // 处理勋章数据
    parseMedals(medals) {
      if(medals == []) return medals;
      let nmedals = [];
      for (let i = 0; i < medals.length; i++) {
          // if (medals[i] == undefined) continue;
          let outer = medals[i];
          let item = [outer];
          nmedals.push(item);
          for (let k = 0; k < this.data.medals_all.length; k++){
              if (this.data.medals_all[k][0].mkey == item[0].mkey) {
                this.data.medals_all[k][0].type = 1;
                this.data.medals_all[k][0].created_at = item[0].created_at;
                break;
              }
          } 
      }
      return nmedals;
    },

    // 获取徽章
    getMedal() {
      return new Promise((resolve, reject)=>{
        wx.request({
            url: app.config.getHostUrl()+'/api/user/lightMedal',
            data: { 
              "rid": this.data.user.rid,
              "meid": this.data.medal[0].meid
            },
            method: 'POST',
            success: (result)=>{
                if(result.data.isSuccess){
                    resolve(result.data.data);
                    this.data.medal[0].type = 1;
                }else{
                    reject(result.data.msg);
                }
            },
            fail: ()=>{},
            complete: ()=>{
              wx.redirectTo({
                url: '/pages/user/medals/medals?medal='+this.data.medal_data,
              })
            }
        });
      })
    },
})