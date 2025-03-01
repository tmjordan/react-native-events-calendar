// @flow
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import populateEvents from './Packer'
import React from 'react'
import moment from 'moment'
import _ from 'lodash'

const LEFT_MARGIN = 60 - 1
// const RIGHT_MARGIN = 10
const CALENDER_HEIGHT = 2400
// const EVENT_TITLE_HEIGHT = 15
const TEXT_LINE_HEIGHT = 17
// const MIN_EVENT_TITLE_WIDTH = 20
// const EVENT_PADDING_LEFT = 4

function range (from, to) {
  return Array.from(Array(to), (_, i) => from + i)
}

const format2Digits = (num) => {
  return ("0" + num).slice(-2);
};

const timeConvert2 = (num) => {
  let hours = (num / 60);
  let rhours = Math.floor(hours);
  let minutes = (hours - rhours) * 60;
  let rminutes = Math.round(minutes);

  let res;

  if (rhours === 0) res = "00:" + format2Digits(rminutes);
  else {
    if (rminutes === 0) res = format2Digits(rhours) + ":00";
    else res = format2Digits(rhours) + ":" + format2Digits(rminutes);
  }

  return res;
};

export default class DayView extends React.PureComponent {
  constructor (props) {
    super(props)
    const width = props.width - LEFT_MARGIN
    const packedEvents = populateEvents(props.events, width)
    let initPosition = _.min(_.map(packedEvents, 'top')) - CALENDER_HEIGHT / 24
    initPosition = initPosition < 0 ? 0 : initPosition
    this.state = {
      _scrollY: initPosition,
      packedEvents,
      timeNowHour: moment().hour(),
      timeNowMin: moment().minutes(),
    }
  }

  componentWillReceiveProps (nextProps) {
    const width = nextProps.width - LEFT_MARGIN
    this.setState({
      packedEvents: populateEvents(nextProps.events, width)
    })
  }

  componentDidMount () {
    this.props.scrollToFirst && this.scrollToFirst()

    // setInterval(() => {
    //   this.setState({timeNowHour: moment().hour(), timeNowMin: moment().minutes()+5});
    // }, 5000);
  }

  scrollToFirst () {
    setTimeout(() => {
      if (this.state && this.state._scrollY && this._scrollView) {
        this._scrollView.scrollTo({ x: 0, y: this.state._scrollY, animated: true })
      }
    }, 1)
  }

  _renderRedLine() {
    const offset = CALENDER_HEIGHT / 24
    const { format24h } = this.props
    const { width, styles } = this.props
    // const timeNowHour = moment().hour()
    // const timeNowMin = moment().minutes()
    return (
        <View
            style={{
              ...styles.lineNow,
              top: offset * this.state.timeNowHour + offset * this.state.timeNowMin / 60, width: width - 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
        >
          <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: 'red',
              }}
          />
          <View
              key={`timeNow`}
              style={[styles.lineNow, { top: offset * this.state.timeNowHour + offset * this.state.timeNowMin / 60, width: width - 20 }]}
          />
        </View>
    )
  }

  _renderLines () {
    const offset = CALENDER_HEIGHT / 24
    const { format24h, start, end } = this.props

    return range(0, 25).map((item, i) => {
      let timeText
      if (i === 0) {
        timeText = ``
      } else if (i < 12) {
        timeText = !format24h ? `${i} AM` : timeConvert2(i*60)
      } else if (i === 12) {
        timeText = !format24h ? `${i} PM` : timeConvert2(i*60)
      } else if (i === 24) {
        timeText = !format24h ? `12 AM` : timeConvert2(0*60)
      } else {
        timeText = !format24h ? `${i - 12} PM` : timeConvert2(i*60)
      }
      const { width, styles } = this.props
      return [
        <Text
            key={`timeLabel${i}`}
            style={[styles.timeLabel, { top: offset * i - 6 }]}
        >
          {timeText}
        </Text>,
        i === 0 ? null : (
            <View
                key={`line${i}`}
                style={[styles.line, { top: offset * i, width: width - 20 }]}
            />
        ),
        <View
            key={`lineHalf${i}`}
            style={[styles.line, { top: offset * (i + 0.5), width: width - 20 }]}
        />
      ]
    })
  };

  _renderTimeLabels () {
    const { styles } = this.props
    const offset = CALENDER_HEIGHT / 24
    return range(0, 24).map((item, i) => {
      return (
          <View key={`line${i}`} style={[styles.line, { top: offset * i }]} />
      )
    })
  }

  _onEventTapped (event) {
    this.props.eventTapped(event)
  };

  _renderEvents () {
    const { styles } = this.props
    const { packedEvents } = this.state
    let events = packedEvents.map((event, i) => {
      const style = {
        left: event.left,
        height: event.height,
        width: event.width,
        top: event.top
      }

      // Fixing the number of lines for the event title makes this calculation easier.
      // However it would make sense to overflow the title to a new line if needed
      const numberOfLines = Math.floor(event.height / TEXT_LINE_HEIGHT)
      const formatTime = this.props.format24h ? 'HH:mm' : 'hh:mm A'
      return (
          <View
              key={i}
              style={[styles.event, style]}
          >
            {this.props.renderEvent ? this.props.renderEvent(event) : (
                <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={() => this._onEventTapped(this.props.events[event.index])}
                >
                  <Text numberOfLines={1} style={styles.eventTitle}>{event.title || 'Event'}</Text>
                  {numberOfLines > 1
                      ? <Text
                          numberOfLines={numberOfLines - 1}
                          style={[styles.eventSummary]}
                      >
                        {event.summary || ' '}
                      </Text>
                      : null}
                  {numberOfLines > 2
                      ? <Text style={styles.eventTimes} numberOfLines={1}>{moment(event.start).format(formatTime)} - {moment(event.end).format(formatTime)}</Text>
                      : null}
                </TouchableOpacity>
            )}
          </View>
      )
    })

    return (
        <View>
          <View style={{ marginLeft: LEFT_MARGIN }}>
            {events}
          </View>
        </View>
    )
  }

  render () {
    const { styles } = this.props
    return (
        <ScrollView
            ref={ref => (this._scrollView = ref)}
            contentContainerStyle={[styles.contentStyle, { width: this.props.width }]}
        >
          {this._renderLines()}
          {this._renderEvents()}
          {this._renderRedLine()}
        </ScrollView>
    )
  }
}
