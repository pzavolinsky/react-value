React `value`
=============

When we think about how a user interacts with our components, we can classify those components in one of two categories: *read-only* components and *value* components.

*Value* components _display_ a value and provide a way to _update_ the value. *Read-only* components only _display_ a value.

The scenic route
----------------

Intuitively which of the following would you say is a *read-only* component and which one is a *value* component?

```js
const WithBorder1 = ({ value }) =>
  <div className="with-border">
    {value}
  </div>;

const WithBorder2 = ({ value, onChange }) =>
  <div className="with-border">
    <input value={value} onChange={onChange} />
  </div>;
```

The dead giveaway is the `onChange` prop. We supply a value in the `value` prop and, when the user produces a new value, the component calls the `onChange` function with that new value.

How about this one?

```js
const MoodSwing = ({ happy, newMood }) =>
  <button onClick={() => newMood(!happy)}>
    {happy
      ? ':)'
      : ':('
    }
  </button>;
```

Even though the names are all wrong, this component toggles the `happy` prop. This means that `happy` is the component's *value* and `newMood` is a degenerate *onChange*.

Lets rewrite `MoodSwing` to use `value` and `onChange`:

```js
const MoodSwing = ({ value, onChange }) =>
  <button onClick={() => onChange({ target:{ value: !value } })}>
    {value
      ? ':)'
      : ':('
    }
  </button>;
```

*Now what's all that nonsense in the `onChange` call?*

If you recall from React's built-in components, the argument to `onChange` is an event. More specifically, a synthetic event whose `target` prop represents the component that changed with an updated `value` prop.

So in short, if we want to be (a bit) consistent with the built-in components we need to wrap our new value in something that has a `target`, thus:

```js
onChange({ target: { value: newValue } })
```

Technically, if we wanted to be even more consistent, at the expense of efficiency, we should merge the previous props into `target` as well:

```js
onChange({ target: Object.assign({}, this.props, { value: newValue }) })
```

Personally, I think this is too much so I just stick with `target: { value: newValue }`.

*But wait, why should we even bother to be consistent?*

Consider this guy:

```js
const Upper = ({ children, value, onChange }) =>
  React.cloneElement(children, {
  		value,
  		onChange: e => onChange({
  			target: {
    			value: (e.target.value || '').toUpperCase()
    		}
  		})
  	});
```

Now let's apply `Upper` to `input` (a built-in component):

```js
const UpperInput = props => <Upper {...props}><input/></Upper>;
```

Cool, how about the old `WithBorder2` from a previous example:

```js
const UpperBorder = props => <Upper {...props}><WithBorder2/></Upper>;
```

So the obvious argument for consistency is that you can use your components in place of the built-in ones.

Regardless of whether you wrap your `onChange` value or not, and whether you merge the props into `target` or not, there something pretty powerful going on here:

  > The `value`/`onChange` props provide a predictable interface for components that *hold* a value.

In other words, if we stick to the `value`/`onChange` props, just by looking at the component's props you know what can change (i.e. the `value`, and _only_ the `value`) and what is just arguments required to display or control the component's behavior (e.g. `className`, `readOnly`, etc.).

Making our life easier
----------------------

Ok, so by now we are cool with sticking everything that can change in a single `value` prop and to inform value changes though a single `onChange` callback. How can we simplify all the `target` boilerplate?

Lets do this step-by-step:

```js
class MoodSwing extends React.Component {
  render() {
    const { value, onChange } = this.props;
    return <button onClick={() => onChange({ target: { value: !value } })}>
      {value
        ? ':)'
        : ':('
      }
    </button>;
  }
}
```

Notice the call to `onChange`, that whole `target` and `value` business? We are going to be doing that thing quite a bit, so we could write a helper for that:

```js
class ValueComponent extends React.Component {
  setValue(value) {
    const { onChange } = this.props;
    onChange({ target: { value } });
  }
}

class MoodSwing extends ValueComponent {
  render() {
    const { value } = this.props;
    return <button onClick={() => this.setValue(!value)}>
      {value
        ? ':)'
        : ':('
      }
    </button>;
  }
}
```

Better, but how about the case when we just want to put stuff around an existing component? For example:

```js
class MoodSwingWithBorder extends ValueComponent {
  render() {
    const { value } = this.props;
    return <div className="with-border">
      <MoodSwing value={value} onChange={e => this.setValue(e.target.value)} />
    </div>;
  }
}
```

Is there a way to simplify that `onChange`?

You can think of `setValue` as a way of wrapping a value with an event and `e.target.value` as a way of unwrapping an event to extract the value. So calling `setValue(e.target.value)` yields an event similar to `e` (at least regarding to its value):

```js
class MoodSwingWithBorder extends ValueComponent {
  render() {
    const { value, onChange } = this.props;
    return <div className="with-border">
      <MoodSwing value={value} onChange={onChange} />
    </div>;
  }
}
```

How about when `value` is a complex object? For example:

```js
class Person extends ValueComponent {
  render() {
    const { value } = this.props;
    return <div>
      <div>
      First
      <input
        value={value.first}
        onChange={e => this.setValue(Object.assign({}, value, { first: e.target.value }))}
      />
      </div>
      <div>
      Last
      <input
        value={value.last}
        onChange={e => this.setValue(Object.assign({}, value, { last: e.target.value }))}
      />
      </div>
    </div>;
  }
}
```

Clearly we need a way to merge a known key into the value when the `input` changes so lets add that helper into `ValueComponent`:

```js
class ValueComponent extends React.Component {
  setValue(value) {
    const { onChange } = this.props;
    onChange({ target: { value } });
  }
  mergeValue(propName, propValue) {
    const { value } = this.props;
    this.setValue(Object.assign({}, value, { [propName]: propValue }));
  }
}

class Person extends ValueComponent {
  render() {
    const { value } = this.props;
    return <div>
      <div>
      First
      <input
        value={value.first}
        onChange={e => this.mergeValue('first', e.target.value)}
      />
      </div>
      <div>
      Last
      <input
        value={value.last}
        onChange={e => this.mergeValue('last', e.target.value)}
      />
      </div>
    </div>;
  }
}
```

Better, but we can go further. See how the built-in `input` is a *value* component, and we want to merge its value into `first` and `last`? We could write a helper to simplify this case even further:

```js
class ValueComponent extends React.Component {
  setValue(value) {
    const { onChange } = this.props;
    onChange({ target: { value } });
  }
  mergeValue(propName, propValue) {
    const { value } = this.props;
    this.setValue(Object.assign({}, value, { [propName]: propValue }));
  }
  onChangeMergeValue(propName) {
    return e => this.mergeValue(propName, e.target.value);
  }
}

class Person extends ValueComponent {
  render() {
    const { value } = this.props;
    return <div>
      <div>
      First
      <input
        value={value.first}
        onChange={this.onChangeMergeValue('first')}
      />
      </div>
      <div>
      Last
      <input
        value={value.last}
        onChange={this.onChangeMergeValue('last')}
      />
      </div>
    </div>;
  }
}
```

Playing nice with React
-----------------------

So far in our examples we've been passing lambdas to our child components. For example:

```js
class Person extends ValueComponent {
  render() {
    const { value } = this.props;
    return <div>
      <div>
      First
      <input
        value={value.first}
        onChange={e => this.mergeValue('first', e.target.value)}
      />
      </div>
      <div>
      Last
      <input
        value={value.last}
        onChange={e => this.mergeValue('last', e.target.value)}
      />
      </div>
    </div>;
  }
}
```

See that `e => this.mergeValue('first', e.target.value)`? That's a lambda that we are passing to `input` and this is bad.

The reason why this is bad is that every time that we `render()` we will be creating a new function with essentially the same implementation. In other words, the props for the `input`s will change on every render, even if we don't change the value. This in turn makes it very difficult to apply performance optimizations to those `input`s.

If you look back at our `onChangeMergeValue` implementation you'll see that we are returning a lambda so even though is not apparent, we have the same problem. That is:

```js
this.onChangeMergeValue('last') // is the same as
e => this.mergeValue('last', e.target.value)
```

Luckily there is an easy workaround: we can cache those lambdas by the `propName`.

```js
class ValueComponent extends React.Component {
  constructor(props, ctx) {
    super(props, ctx);
    this.mergeValueCache = {};
  }
  setValue(value) {
    const { onChange } = this.props;
    onChange({ target: { value } });
  }
  mergeValue(propName, propValue) {
    const { value } = this.props;
    this.setValue(Object.assign({}, value, { [propName]: propValue }));
  }
  onChangeMergeValue(propName) {
    return this.mergeValueCache[propName]
      || (this.mergeValueCache[propName] =
        e => this.mergeValue(propName, e.target.value)
      );
  }
}
```

Note that this makes sense because the `propName`s that we use are always string literals (e.g. `first`, `last`, etc.) and we know for a fact that there's going to be only a few of those.

Stateless value components
--------------------------

So far our `ValueComponent` base class is looking good but there is one catch, we can only use it for `class` components. It would be nice if we could write a high-order function that could turn any stateless component into a `ValueComponent`.

Lets give it a try:

```js
const valueComponent = compFn =>
  class FnValueComponent extends ValueComponent {
    constructor(props, ctx) {
      super(props, ctx);
      this.setValue = this.setValue.bind(this);
      this.mergeValue = this.mergeValue.bind(this);
      this.onChangeMergeValue = this.onChangeMergeValue.bind(this);
    }
    render() {
      return compFn(
        Object.assign({}, this.props, {
          setValue: this.setValue,
          mergeValue: this.mergeValue,
          onChangeMergeValue: this.onChangeMergeValue
        })
      );
    }
  };  
```

And now we can rewrite our `Person` to be stateless:

```js
const StatelessPerson = valueComponent(
  ({ value, onChangeMergeValue }) =>
    <div>
      <div>
        First
        <input
          value={value.first}
          onChange={onChangeMergeValue('first')}
        />
      </div>
      <div>
        Last
        <input
          value={value.last}
          onChange={onChangeMergeValue('last')}
        />
      </div>
    </div>
);
```

Summary
-------

```js
export class ValueComponent extends React.Component {
  constructor(props, ctx) {
    super(props, ctx);
    this.mergeValueCache = {};
  }
  setValue(value) {
    const { onChange } = this.props;
    onChange({ target: { value } });
  }
  mergeValue(propName, propValue) {
    const { value } = this.props;
    this.setValue(Object.assign({}, value, { [propName]: propValue }));
  }
  onChangeMergeValue(propName) {
    return this.mergeValueCache[propName]
      || (this.mergeValueCache[propName] =
        e => this.mergeValue(propName, e.target.value)
      );
  }
}

export const valueComponent = compFn =>
  class FnValueComponent extends ValueComponent {
    constructor(props, ctx) {
      super(props, ctx);
      this.setValue = this.setValue.bind(this);
      this.mergeValue = this.mergeValue.bind(this);
      this.onChangeMergeValue = this.onChangeMergeValue.bind(this);
    }
    render() {
      return compFn(
        Object.assign({}, this.props, {
          setValue: this.setValue,
          mergeValue: this.mergeValue,
          onChangeMergeValue: this.onChangeMergeValue
        })
      );
    }
  };  
```
