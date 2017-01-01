"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var react_1 = require("react");
var ValueComponent = (function (_super) {
    __extends(ValueComponent, _super);
    function ValueComponent() {
        var _this = _super.apply(this, arguments) || this;
        _this.mergeValueCache = {};
        return _this;
    }
    ValueComponent.prototype.setValue = function (value) {
        var onChange = this.props.onChange;
        onChange({ target: { value: value } });
    };
    ValueComponent.prototype.mergeValue = function (propName, propValue) {
        this.setValue(__assign({}, this.props.value, (_a = {}, _a[propName] = propValue, _a)));
        var _a;
    };
    ValueComponent.prototype.onChangeMergeValue = function (propName) {
        var _this = this;
        return this.mergeValueCache[propName]
            || (this.mergeValueCache[propName] =
                function (e) { return _this.mergeValue(propName, e.target.value); });
    };
    return ValueComponent;
}(react_1.Component));
exports.ValueComponent = ValueComponent;
function valueComponent(compFn) {
    return (function (_super) {
        __extends(FnValueComponent, _super);
        function FnValueComponent(props, ctx) {
            var _this = _super.call(this, props, ctx) || this;
            _this.setValue = _this.setValue.bind(_this);
            _this.mergeValue = _this.mergeValue.bind(_this);
            _this.onChangeMergeValue = _this.onChangeMergeValue.bind(_this);
            return _this;
        }
        FnValueComponent.prototype.render = function () {
            return compFn(__assign({}, this.props, { setValue: this.setValue, mergeValue: this.mergeValue, onChangeMergeValue: this.onChangeMergeValue }));
        };
        return FnValueComponent;
    }(ValueComponent));
}
exports.valueComponent = valueComponent;
