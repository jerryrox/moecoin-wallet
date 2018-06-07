import React from 'react';
import SendPresenter from './SendPresenter';

export default class SendContainer extends React.Component {
    render() {
        return(
            <SendPresenter {...this.props} />
        );
    }
}
