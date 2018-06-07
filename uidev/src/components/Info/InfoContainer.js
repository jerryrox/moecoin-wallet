import React from 'react';
import InfoPresenter from './InfoPresenter';

export default class InfoContainer extends React.Component {
    
    render() {
        return(
            <InfoPresenter {...this.props} />
        );
    }
}
