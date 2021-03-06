import React, { Component } from 'react';
import { Redirect } from 'react-router';
import { firebaseHelper } from './FirebaseHelper';
import ProgressBar from 'react-toolbox/lib/progress_bar/ProgressBar';

export const withAuth = (WrappedComponent) => {
  return class PageWithAuth extends Component {
    render() {
      if (!firebaseHelper.isLoggedIn()) {
        return (
          <Redirect to='/login' />
        );
      } else {
        return (
          <WrappedComponent {...this.props}></WrappedComponent>
        );
      }
    }
  }
};

export const withNoResults = (WrappedComponent, array) => {
  return class extends Component {
    render() {
      if (!array || array.length === 0) {
        return (
          <span className="text-muted text-nenhum-resultado"><em>Nenhum resultado encontrado</em></span>
        );
      } else {
        return (
          <WrappedComponent {...this.props} />
        );
      }
    }
  }
}

export const withSpinner = (WrappedComponent) => {
  const Spinner = () =>
    <div className="with-spinner">
      <ProgressBar
        type="circular"
        mode="indeterminate"
//        value={100}
        className="spinner-progress"
      />
    </div>

  return class extends Component {
    render() {
      if (this.props.active) {
        return (
          <Spinner />
        );
      } else {
        return (
          <WrappedComponent {...this.props}></WrappedComponent>
        );
      }
    }
  }
};


