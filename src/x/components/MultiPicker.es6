/**
 * @file components/MultiPicker.es
 * @author leeight
 */

import u from 'lodash';
import {defineComponent} from 'san';

import {hasUnit, arrayTreeFilter, arrayTreeFilterIndex, arrayTreeCompact, create} from './util';
import {asInput} from './asInput';
import Layer from './Layer';
import Icon from './Icon';
import Loading from './Loading';

const cx = create('ui-select');

const kDefaultLabel = '请选择';
const kValuesKey = 'value';
const kTmpValuesKey = '__values';

/* eslint-disable */
const template = `<div on-click="toggleLayer($event)" class="{{mainClass}}">
    <span class="${cx('text')}">{{label|raw}}</span>
    <ui-layer open="{=active=}" s-ref="layer" offset-top="{{3}}">
        <div class="${cx('layer')} ${cx('layer-x')} ${cx('multipicker-layer')}" style="{{layerStyle}}">
            <ul s-for="datastore, levelIndex in compactLevels">
                <li class="{{item.disabled ? '${cx('item', 'item-disabled')}' : item.active ? '${cx('item', 'item-selected')}' : '${cx('item')}'}}"
                    on-click="onItemClicked(item, levelIndex)"
                    s-for="item in datastore">
                    <span>
                        {{item.text}}
                        <ui-loading size="small" s-if="item.loading" />
                        <ui-icon name="color-error" s-elif="item.error" />
                        <ui-icon name="arrow-right" s-elif="item.expandable" />
                    </span>
                </li>
            </ul>
        </div>
    </ui-layer>
</div>`;
/* eslint-enable */

const MultiPicker = defineComponent({
    template,
    components: {
        'ui-loading': Loading,
        'ui-icon': Icon,
        'ui-layer': Layer
    },
    initData() {
        return {
            disabled: false,
            active: false,
            layerWidth: 'auto',
            loader: null,             // 数据异步加载的loader，逐步的填充 datasource 的内容
            datasource: [],
            [kValuesKey]: [],
            [kTmpValuesKey]: []       // 临时的值，点击了之后，同步到 value 里面去
        };
    },
    computed: {
        // datasource 是树形结构
        // compactLevels 是打平之后的，用户看到的和可以操作的是 compactLevels 的数据
        compactLevels() {
            const values = this.data.get(kTmpValuesKey);
            const datasource = this.data.get('datasource');
            const compactLevels = arrayTreeCompact(values, datasource);

            return compactLevels;
        },
        mainClass() {
            const klass = cx.mainClass(this);
            const active = this.data.get('active');
            if (active) {
                klass.push('state-active');
                klass.push(cx('active'));
            }
            return klass;
        },
        layerStyle() {
            const style = {};
            const layerWidth = this.data.get('layerWidth');
            if (layerWidth != null) {
                style.width = hasUnit(layerWidth) ? layerWidth : `${layerWidth}px`;
            }
            return style;
        },
        label() {
            const values = this.data.get(kValuesKey);
            const datasource = this.data.get('datasource');
            const nodes = arrayTreeFilter(datasource, (item, level) => item.value === values[level]);
            const labels = u.map(nodes, item => item.text);
            return labels.length ? labels.join(' / ') : kDefaultLabel;
        }
    },
    inited() {
        const values = this.data.get(kValuesKey);
        this.data.set(kTmpValuesKey, values);
        this.watch(kValuesKey, values => this.data.set(kTmpValuesKey, values));
    },
    onItemClicked(item, index) {
        if (item.disabled) {
            return;
        }

        this.expandChildren(item, index);
        if (item.expandable) {
            return;
        }

        this.data.set('active', false);
        const values = this.data.get(kTmpValuesKey);
        this.data.set(kValuesKey, values);
        this.fire('change', {[kValuesKey]: values});
    },
    expandChildren(item, index) {
        if (item.disabled) {
            return;
        }

        const loader = this.data.get('loader');
        if (typeof loader === 'function') {
            this.expandChildrenAync(item, index);
        }
        else {
            this.expandChildrenInternal(item, index);
        }
    },

    expandChildrenAync(item, index) {
        const values = [...this.data.get(kTmpValuesKey)];
        values[index] = item.value;
        values.splice(index + 1);     // 删掉多余的数据
        if (values.length <= 0) {
            return;
        }

        const datasource = this.data.get('datasource');
        const indexes = arrayTreeFilterIndex(datasource, (item, level) => item.value === values[level]);
        const itemKey = u.map(indexes,
            (v, i) => i === 0 ? `datasource[${v}]` : `children[${v}]`).join('.');   // eslint-disable-line

        const lastNode = this.data.get(itemKey);
        if (!lastNode || lastNode.children || !lastNode.expandable) {
            // 之前已经加载过了 或者 是叶子节点
            this.expandChildrenInternal(item, index);
            return;
        }

        // 显示加载的icon
        this.data.set(`${itemKey}.loading`, true);
        this.data.set(`${itemKey}.error`, null);

        const loader = this.data.get('loader');
        return loader(values).then(children => {
            this.data.set(`${itemKey}.loading`, false);

            // 追加到 datasource 里面去
            if (children.length <= 0) {
                this.data.set(`${itemKey}.expandable`, false);
            }
            else {
                this.data.set(`${itemKey}.children`, children);
            }

            this.expandChildrenInternal(item, index);
        }).catch(error => {
            this.data.set(`${itemKey}.loading`, false);
            this.data.set(`${itemKey}.error`, error);
        });
    },

    /**
     * Expand the submenu
     *
     * @private
     * @param {Object} item The selected item.
     * @param {number} index The level index.
     */
    expandChildrenInternal(item, index) {
        this.data.set(`${kTmpValuesKey}[${index}]`, item.value);
        const values = this.data.get(kTmpValuesKey);
        for (let i = index + 1; i < values.length; i++) {
            this.data.removeAt(kTmpValuesKey, i);
        }
    },

    toggleLayer(e) {
        const disabled = this.data.get('disabled');
        if (disabled) {
            return;
        }
        // 同步一下数据
        const values = this.data.get(kValuesKey);
        this.data.set(kTmpValuesKey, values);

        const active = this.data.get('active');
        this.data.set('active', !active);
    }
});

export default asInput(MultiPicker);
