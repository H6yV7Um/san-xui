/**
 * @file demos/xui-form.es6
 * @author leeight
 */

import {defineComponent} from 'san';
import * as AsyncValidator from 'async-validator';
import Form from 'inf-ui/x/forms/Form';
import FormItem from 'inf-ui/x/forms/FormItem';
import Toast from 'inf-ui/x/components/Toast';
import TextBox from 'inf-ui/x/components/TextBox';
import SMSCodeBox from 'inf-ui/x/components/SMSCodeBox';
import Button from 'inf-ui/x/components/Button';

import Row from './Row';
import * as rules from './rules';

const Schema = AsyncValidator.default;

const formValidator = new Schema({
    userName: [
        {required: true, message: '用户名必填'},
        {min: 6, max: 32, message: '用户名长度必须是 6 到 32 个字符之间'},
        rules.noInvalidChar('用户名')
    ],
    verifyCode: [
        {required: true, message: '短信验证码必填'}
    ],
    mobile: [
        {required: true, message: '手机号必填'},
        {pattern: /^\d{11}$/, message: '手机号格式不正确'}
    ],
    password: [
        {required: true, message: '密码必填'},
        {min: 6, max: 32, message: '密码长度必须是 6 到 32 个字符之间'},
        rules.password('密码'),
        rules.noInvalidChar('密码')
    ],
    confirmPassword: [
        {required: true, message: '确认密码必填'},
        {min: 6, max: 32, message: '确认密码长度必须是 6 到 32 个字符之间'},
        rules.password('确认密码'),
        rules.noInvalidChar('确认密码'),
        rules.equals('password')
    ]
});


/* eslint-disable */
const template = `<template>
<x-row label="[default]">
    <xui-form rules="{{rules}}" formData="{=formData=}" errors="{=formErrors=}">
        <xui-item name="userName"><xui-textbox
            placeholder="用户名"
            type="text"
            value="{=formData.userName=}" /></xui-item>
        <xui-item name="password"><xui-textbox
            placeholder="密码"
            type="password"
            value="{=formData.password=}" /></xui-item>
        <xui-item name="confirmPassword"><xui-textbox
            placeholder="确认密码"
            type="password"
            value="{=formData.confirmPassword=}" /></xui-item>
        <xui-item name="mobile"><xui-textbox
            placeholder="手机号"
            type="number"
            name="mobile"
            value="{=formData.mobile=}" /></xui-item>
        <xui-item name="verifyCode">
            <xui-smscode width="{{110}}" />
        </xui-item>
        <xui-item>
            <xui-button on-click="doSubmit" disabled="{{!canSubmit}}" skin="primary">
                {{loading ? '提交中...' : '同意条款并注册'}}
            </xui-button>
        </xui-item>
    </xui-form>
</x-row>

<x-row label="edit,formData=...">
</x-row>
</template>`;
/* eslint-enable */

export default defineComponent({
    template,
    components: {
        'x-row': Row,
        'xui-textbox': TextBox,
        'xui-smscode': SMSCodeBox,
        'xui-button': Button,
        'xui-form': Form,
        'xui-item': FormItem
    },
    computed: {
        canSubmit() {
            const loading = this.data.get('loading');
            const formData = this.data.get('formData');
            const formErrors = this.data.get('formErrors');
            // TODO(leeight) 这个需要再调整一下，这样子做太繁琐了
            return !loading
                && formData
                && formData.userName
                && formData.password
                && formData.confirmPassword
                && formData.mobile
                && formData.verifyCode
                && !formErrors;
        }
    },
    initData() {
        return {
            loading: false,
            rules: formValidator,
            formData: null,
            formErrors: null
        };
    },
    doSubmit() {
        this.data.set('loading', true);
        setTimeout(() => {
            this.data.set('loading', false);
            Toast.success('创建成功');
        }, 1000);
    }
});
