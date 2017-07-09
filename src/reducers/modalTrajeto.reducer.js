import { ModalTrajetoActionType } from '../actions/actionTypes'
import Immutable from 'seamless-immutable';

export const initialState = Immutable({
  isVisible: false
});

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case ModalTrajetoActionType.SET_VISIBLE: {
      return {
        ...state,
        isVisible: action.payload
      };
    }
    default: {
      return state;
    }
  }
};

export default reducer;