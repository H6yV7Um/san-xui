/**
 * 之前的 ActionPanel 的功能
 * @file components/ActionLoader.js
 * @author leeight
 */
import {Component, defineComponent} from 'san';
import Deferred from 'er/Deferred';
import events from 'er/events';
import MiniEvent from 'mini-event';
import controller from 'er/controller';
import {loadAppInBackground} from 'inf-ria/helper';

import {create, html} from './util';
import Loading from './Loading';

const cx = create('ui-actionloader');

/* eslint-disable */
const template = html`
<div class="{{mainClass}}">
    <div class="${cx('error')}" s-if="error"><pre>{{error}}</pre></div>
    <ui-loading s-if="loading" />
    <div s-ref="ghost" style="{{mainStyle}}"></div>
</div>`;
/* eslint-enable */

function delegateActionEvent(e) {
    const event = MiniEvent.fromEvent(e, {preserveData: true, syncState: true});
    event.type = 'action-' + e.type;
    this.fire(event);
}

function attachAction(e) {
    if (!this.actionMatched(e)) {
        return;
    }

    const action = this.action = e.action;

    // 代理所有的子Action的事件
    if (typeof action.on === 'function') {
        action.on('*', delegateActionEvent, this);
    }

    this.fire('actionattach', e);
}

function notifyActionLoadComplete(e) {
    if (!this.actionMatched(e)) {
        return;
    }
    this.data.set('loading', false);
    this.data.set('error', null);
    this.fire('actionloaded', e);
}

function notifyActionLoadFailed(e) {
    if (!this.actionMatched(e)) {
        return;
    }

    const url = this.data.get('url');

    this.action = null;
    this.data.set('loading', false);
    this.data.set('error', new Error('Action Enter Failed, Url = ' + url + ', Reason: ' + e.reason));
    this.fire(
        'actionloadfail',
        {failType: e.failType, reason: e.reason}
    );
}

function notifyActionLoadAborted(e) {
    if (!this.actionMatched(e)) {
        return;
    }

    this.data.set('loading', false);
    this.data.set('error', new Error('Action Load Aborted'));
    this.fire('actionloadabort', e);
}

export default defineComponent({
    template,
    components: {
        'ui-loading': Loading
    },
    initData() {
        return {
            loading: true,
            error: null,
            width: '100%',
            height: null,
            url: null,
            options: null
        };
    },
    computed: {
        mainStyle() {
            const loading = this.data.get('loading');
            const error = this.data.get('error');
            const style = cx.mainStyle(this);
            style.display = (loading || error) ? 'none' : 'block';
            return style;
        },
        mainClass() {
            return cx.mainClass(this);
        }
    },

    inited() {
        const url = this.data.get('url');
        if (!url) {
            this.data.set('error', new Error('action-url MUST be provided.'));
        }

        this.watch('url', url => {
            this.disposeAction();
            this.data.set('loading', true);
            this.data.set('error', null);
            this.reloadAction();
        });

        events.on('enteraction', attachAction, this);
        events.on('enteractioncomplete', notifyActionLoadComplete, this);
        events.on('actionnotfound', notifyActionLoadFailed, this);
        events.on('permissiondenied', notifyActionLoadFailed, this);
        events.on('actionfail', notifyActionLoadFailed, this);
        events.on('enteractionfail', notifyActionLoadFailed, this);
        events.on('actionabort', notifyActionLoadAborted, this);
    },

    attached() {
        this.reloadAction();
    },

    actionMatched(e) {
        const ghost = this.ref('ghost');
        return (e.isChildAction && ghost && ghost.id === e.container);
    },

    reloadAction() {
        const module = this.data.get('module');
        if (module) {
            loadAppInBackground(module).then(() => this.renderAction());
        }
        else {
            this.renderAction();
        }
    },

    renderAction() {
        const {url, options} = this.data.get();
        const ghost = this.ref('ghost');
        const action = this.action = controller.renderChildAction(url, ghost.id, options);

        // 如果发生错误，因为事件是同步触发的，
        // 因此先执行`notifyActionLoadFailed`再赋值，导致没清掉。
        // 错误时返回的`Promise`对象是没有`abort`方法的，
        // 这种对象我们也不需要，因此直接清掉
        if (typeof action.abort !== 'function') {
            action.abort = null;
        }
    },

    disposeAction() {
        const action = this.action;
        if (!action) {
            return;
        }

        if (Deferred.isPromise(action) && typeof action.abort === 'function') {
            action.abort();
        }
        else {
            if (typeof action.un === 'function') {
                action.un('*', delegateActionEvent, this);
            }
            if (typeof action.leave === 'function') {
                action.leave();
            }
        }
    },

    dispose(dontDetach) {
        this.disposeAction();
        events.un('enteraction', attachAction, this);
        events.un('enteractioncomplete', notifyActionLoadComplete, this);
        events.un('actionnotfound', notifyActionLoadFailed, this);
        events.un('permissiondenied', notifyActionLoadFailed, this);
        events.un('actionfail', notifyActionLoadFailed, this);
        events.un('enteractionfail', notifyActionLoadFailed, this);
        events.un('actionabort', notifyActionLoadAborted, this);
        Component.prototype.dispose.call(this, dontDetach);
    }
});
