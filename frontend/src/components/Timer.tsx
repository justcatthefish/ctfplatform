import * as React from "react";
import {observable} from "mobx";
import {observer} from "mobx-react";

import "@styles/timer.scss";

@observer
export default class Timer extends React.Component<ITimerProps, {}> {
    @observable days: string = "00";
    @observable hours: string = "00";
    @observable minutes: string = "00";
    @observable seconds: string = "00";

    interval: any;

    componentDidMount(): void {
        this.updateTime( );

        this.interval = setInterval( this.updateTime, 1000 );
    }

    componentWillUnmount(): void {
        if( this.interval )
            clearInterval( this.interval );
    }

    componentDidUpdate(prevProps: Readonly<ITimerProps>): void {
        if( this.props.date !== prevProps.date ) {
            if( this.interval )
                clearInterval( this.interval );

            this.interval = setInterval( this.updateTime, 1000 );
        }
    }

    render( ) {
        return (
            <div className={"time"}>
                <div data-type="days">{this.days}</div>
                <div className={"spacer"}/>
                <div data-type="hours">{this.hours}</div>
                <div className={"spacer"}/>
                <div data-type="minutes">{this.minutes}</div>
                <div className={"spacer"}/>
                <div data-type="seconds">{this.seconds}</div>
            </div>
        );
    }

    updateTime = ( ) => {
        const t = this.props.date.getTime() - new Date( ).getTime();

        if( t <= 0 ) {
            if( this.interval )
                clearInterval(this.interval);

            return;
        }

        const tempSeconds = Math.floor( (t/1000) % 60 );
        const tempMinutes = Math.floor( (t/1000/60) % 60 );
        const tempHours = Math.floor( (t/(1000*60*60)) % 24 );
        const tempDays = Math.floor( t/(1000*60*60*24) );

        if( this.seconds !== tempSeconds.toString( ) ) this.seconds = tempSeconds < 10 ? "0" + tempSeconds : tempSeconds.toString();
        if( this.minutes !== tempMinutes.toString( ) ) this.minutes = tempMinutes < 10 ? "0" + tempMinutes : tempMinutes.toString();
        if( this.hours !== tempHours.toString( ) ) this.hours = tempHours < 10 ? "0" + tempHours : tempHours.toString();
        if( this.days !== tempDays.toString( ))  this.days = tempDays < 10 ? "0" + tempDays : tempDays.toString();
    };
}

interface ITimerProps {
    date: Date
}