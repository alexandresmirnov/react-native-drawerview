import React, { Component } from 'react';
import { View, Animated, PanResponder, Easing } from 'react-native';
import PropTypes from 'prop-types';

class DrawerView extends Component {

  static propTypes = {
    closedOffset: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props);

    //load in props
    this.closedValue = this.props.closedOffset;
    this.openValue = this.props.openOffset == null ? 0 : this.props.openOffset;
    this.threshold = this.props.threshold == null ? 25 : this.props.threshold; //how far before opens/closes; less means it'll snap back to where it was
    this.gestureThreshold = this.props.gestureThreshold == null ? 5 : this.props.gestureThreshold; //how far gesture needs to move before open/close action starts, so that if tap moves slightly touch event still goes through
    this.minVelocityBeyondThreshold = this.props.minVelocityBeyondThreshold == null ? 1 : this.props.minVelocityBeyondThreshold; //minimum velocity in open/close animation when starting beyond threshold
    this.minVelocityWithinThreshold = this.props.minVelocityWithinThreshold == null ? 0.5 : this.props.minVelocityWithinThreshold; //minimum velocity in open/close animation when starting within threshold
    this.velocityThreshold = this.props.velocityThreshold == null ? 0.02 : this.props.velocityThreshold; //how large velocity must be to actually have a direction; any less and will be treated as no movement at all (continuing default action: finishOpening if closed and vice versa)

    //set up starting values
    this.marginTop = new Animated.Value();
    this.marginTopStatic; //updated before and after touch event (not during b/c performance)
    this.marginTop.setValue(this.closedValue); //starts off closed

    this.open = false;


    this.style = {
      flex: 1,
    }

    this.responder = PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onStartShouldSetPanResponder: (evt, gestureState) => false,

      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: this.onMoveShouldSetPanResponder,

      onPanResponderGrant: this.onPanResponderGrant,
      onPanResponderMove: this.onPanResponderMove,
      onPanResponderRelease: this.onPanResponderRelease,
    })
  }



  finishOpening(v) {

    let velocity = v;

    if(Math.abs(this.openValue - this.marginTopStatic) < this.threshold){
      velocity = Math.max(Math.abs(v), this.minVelocityWithinThreshold); //slower when snapping in threshold for smoother UI
    }
    else {
      velocity = Math.max(Math.abs(v), this.minVelocityBeyondThreshold); //more distance, so velocity should be somewhat high
    }

    let duration = Math.abs((this.marginTopStatic - this.openValue) / velocity);

    if(this.marginTopStatic != this.openValue){
      Animated.timing(this.marginTop, {
        toValue: this.openValue,
        easing: Easing.in(Easing.linear),
        duration: duration,
      }).start((status) => {
        //if successfully finished
        if(status.finished == true){
          this.open = true;
        }
      })
    }
    //already open
    else {
      this.open = true;
    }
  }

  finishClosing(v) {
    let velocity = v;

    if(Math.abs(this.marginTopStatic - this.closedValue) < this.threshold){
      velocity = Math.max(Math.abs(v), this.minVelocityWithinThreshold); //slower when snapping in threshold for smoother UI
    }
    else {
      velocity = Math.max(Math.abs(v), this.minVelocityBeyondThreshold); //more distance, so velocity should be somewhat high
    }

    let duration = Math.abs((this.marginTopStatic - this.closedValue) / velocity);


    if(this.marginTopStatic != this.closedValue){
      Animated.timing(this.marginTop, {
        toValue: this.closedValue,
        easing: Easing.in(Easing.linear),
        duration: duration,
      }).start((status) => {
        //if successfully finished
        if(status.finished == true){
          this.open = false;
        }
      })
    }
    //already closed
    else {
      this.open = false;
    }
  }

  setMarginTop(value) {
    this.marginTop.setValue(value);
  }

  flattenOffset(){
    this.marginTop.flattenOffset();
  }

  setOffset(value){
    this.marginTop.setOffset(value);
  }

  onMoveShouldSetPanResponder = (e, gestureState) => {
    //only care about horizontal vs. vertical
    let dh = Math.abs(gestureState.dx);
    let dv = Math.abs(gestureState.dy);

    if(dv >= dh && dv > this.gestureThreshold){
      //swiping up or down, can't interact with child
      return true;
    }

    //swiping sideways, can interact with child
    return false;
  }

  onPanResponderGrant = (e, gestureState) => {
    //stop all animations
    this.marginTop.stopAnimation((value) => {
      this.marginTopStatic = value; //set start position (value of marginTop when latest animation was interrupted)
    });

    this.setOffset(this.marginTopStatic); //set offset of its current value
    this.setMarginTop(0); //set value to 0, will be updated with dy of gesture
  }


  onPanResponderMove = (e, gestureState) => {
    let dy = gestureState.dy;

    //correct for laggy panhandler events not capturing last few pixels
    if(this.marginTopStatic + dy < this.closedValue) {
      //out of bounds up
      this.setMarginTop(this.closedValue - this.marginTopStatic);
    }
    else if(this.marginTopStatic + dy > this.openValue ){
      //out of bounds down
      this.setMarginTop(this.openValue - this.marginTopStatic);
    }
    else {
      //not out of bounds, setting normally
      this.setMarginTop(dy);
    }
  }

  //gesture released
  onPanResponderRelease = (e, gestureState) => {

    let hyp = gestureState.dy + this.marginTopStatic;
    //bound the value
    hyp = Math.max(hyp, this.closedValue);
    hyp = Math.min(hyp, this.openValue);

    this.marginTopStatic = hyp;

    this.flattenOffset(); //merge offset + value into marginTop

    //calculate which way to finish action
    let threshold = this.threshold;
    let velocityThreshold = this.velocityThreshold;
    let velocity = gestureState.vy;
    let delta = gestureState.dy;
    let distance = Math.abs(delta);
    let direction = 'none';

    if(velocity < -1 * velocityThreshold){
      direction = 'up';
    }
    else if(velocity > velocityThreshold){
      direction = 'down';
    }

    /*
      - closed, delta < 0: do nothing
      - closed, 0 < delta < threshold: finishClosing
      - closed, threshold < delta, direction == up: finishClosing
      - closed, threshold < delta, direction == down: finishOpening
      - closed, threshold < delta, direction == none: finishOpening

      - open, 0 < delta: do nothing
      - open, -threshold < delta < 0: finishOpening
      - open, delta < -threshold, direction == up: finishClosing
      - open, delta < -threshold, direction == down: finishOpening
      - open, delta < -threshold, direction == none: finishClosing
      */

    if(!this.open){
      if(delta < 0){
        this.finishClosing(velocity);
      }
      else if(0 < delta && delta < threshold){
        this.finishClosing(velocity);
      }
      else if(threshold < delta){
        if(direction == 'up'){
          this.finishClosing(velocity);
        }
        else if(direction == 'down'){
          this.finishOpening(velocity);
        }
        else {
          this.finishOpening(velocity);
        }
      }
    }
    else {
      if(0 < delta){
        this.finishOpening(velocity);
      }
      else if(-1 * threshold < delta && delta < 0){
        this.finishOpening(velocity);
      }
      else if(delta < -1 * threshold){
        if(direction == 'up'){
          this.finishClosing(velocity);
        }
        else if(direction == 'down') {
          this.finishOpening(velocity);
        }
        else {
          this.finishClosing(velocity);
        }
      }
    }
  }

  render() {
    return (
      <Animated.View
        ref={ref => this.view = ref}
        style={[this.style, {marginTop: this.marginTop}]}
        {...this.responder.panHandlers}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

export default DrawerView;
