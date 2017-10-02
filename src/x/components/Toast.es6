/**
 * @file Toast.es6
 * @author leeight
 */
import {defineComponent} from 'san';

import {create} from './util';

const cx = create('ui-toast');
const kToastContainerId = cx('container') + '-' + new Date().getTime();

/* eslint-disable */
const template = `<template>
    <div class="{{mainClass}}" style="{{style}}">
        {{message}}
    </div>
</template>`;
/* eslint-enable */

const Toast = defineComponent({   // eslint-disable-line
    template,
    components: {},
    computed: {
        style() {
            return {};
        },
        mainClass() {
            const klass = [cx(), cx('x')];
            const level = this.data.get('level');
            if (level) {
                klass.push(cx(level));
            }
            return klass;
        }
    },
    initData() {
        return {
            message: null,
            duration: 3000,
            level: 'success'    // 'success' | 'info' | 'warning' | 'error'
        };
    },
    attached() {
        setTimeout(() => this.dispose(), this.data.get('duration'));
    }
});

function getToastContainer() {
    let container = document.getElementById(kToastContainerId);
    if (!container) {
        container = document.createElement('DIV');
        container.id = kToastContainerId;
        container.className = cx('container');
        document.body.appendChild(container);
    }
    return container;
}

function toastBuilder(level) {
    return message => {
        const comp = new Toast({data: {message, level}});
        comp.attach(getToastContainer());
    };
}

Toast.success = toastBuilder('success');
Toast.info = toastBuilder('info');
Toast.warning = toastBuilder('warning');
Toast.error = toastBuilder('error');

export default Toast;
