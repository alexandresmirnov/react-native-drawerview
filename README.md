### React Native DrawerView

This package exports a DrawerView component whose purpose is to be able to show and hide its top part.  It functions like a normal view, but takes a `closedOffset` parameter to determine how much can be slid open/closed.

### Installation

`npm install --save react-native-drawerview`


### Usage
```javascript
import DrawerView from 'react-native-drawerview'

<DrawerView closedOffset={-300}>
  <View style={{height: 300}}>
    <Text>This will be the drawer part.</Text>
  </View>
  <View style={elevation: 10}>
    <Text>This will always be visible.</Text>
  </View>
</DrawerView>
```

### Props

- `closedOffset {required}`: The offset of the DrawerView when the panel is closed.  Is a negative number to hide a certain amount of the content.
- `openOffset {default: 0}`: The offset when the panel is open.  Default is 0.
- `threshold {default: 0}`: How far drawer must be moved before it snaps open/closed.  E.g. drawer is closed, user moves drawer by a number less than the threshold -> drawer snaps back closed.
- `gestureThreshold {default: 5}`: How far touch must be moved before it starts registering.  With this, if a user taps on a child Touchable but moves their finger slightly during the tap, it will still register.  If this value is too low, it will be hard to tap UI elements because the drawer animation will override the event.
- `minVelocityBeyondThreshold {default: 1}`: The minimum velocity used to calculate how quickly the drawer opens/closes if it has been moved by more than the threshold.  Default is 1, which is a reasonable speed.  If the velocity is higher than this value, the animation will take that instead (resulting in a faster opening/closing animation).
- `minVelocityWithinThreshold {default: 0.5}`: Same as above, except if drawer moved less than threshold.  The default is lower so that the snap-back animation isn't as sudden.
- `velocityThreshold {default: 0.02}`: When a user drags their finger and lets go, the DrawerView has to decide whether to open or close the drawer based on the current velocity.  This value is so that if the user drags, then stops dragging for a moment, and then lets go, the drawer does the expected action (close if open, open if closed).  The principle is much the same as in `gestureThreshold`, where if it's 0, the drawer might behave in unexpected ways (e.g. closing drawer if finger slightly moved up while releasing it from the screen when expecting to open).

### To Do

- add event handlers (`onOpen`, `onClosed`, etc.)
- add option to open drawer programmatically (without gesture)
- add support for tapping events, e.g. tapping outside the drawer to close it

### Credits

- Inspired and heavily influenced by [@root-two](https://github.com/root-two)'s [react-native-drawer](https://github.com/root-two/react-native-drawer)
