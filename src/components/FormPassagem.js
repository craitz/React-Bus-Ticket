import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom'
import { Row, Col, Button, Glyphicon } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { BaseField, withInput, withSelect, withDate } from '../shared/FormFields';
import * as actions from '../actions/formPassagem.actions';
import { newPassagem, setPoltronas } from '../actions/compraPassagem.actions';
import * as utils from '../shared/Utils';
import { withAuth } from '../shared/hoc';
import { firebaseHelper } from '../shared/FirebaseHelper';

const InputField = withInput(BaseField);
const SelectField = withSelect(BaseField);
const DateField = withDate(BaseField);

class FormPassagem extends Component {
  constructor(props, context) {
    super(props, context);
    this.handleChangeNome = this.handleChangeNome.bind(this);
    this.handleChangeOrigem = this.handleChangeOrigem.bind(this);
    this.handleChangeDestino = this.handleChangeDestino.bind(this);
    this.handleChangePoltrona = this.handleChangePoltrona.bind(this);
    this.handleChangeHorario = this.handleChangeHorario.bind(this);
    this.handleChangeData = this.handleChangeData.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  componentDidMount() {
    this.initializeValues();
  }

  updatePoltronas(origem, destino, data, horario) {
    const { dispatch } = this.props;
    const dataFormatted = utils.dateToFirebase(data);
    const horarioFormatted = utils.timeToFirebase(horario);
    const saidasRef = `saidas/${origem}/${destino}/${dataFormatted}/${horarioFormatted}/`;
    const todasPoltronas = utils.SequenceArray(42);

    // carrega apenas as POLTRONAS livres 
    firebaseHelper.fetchKeys(saidasRef)
      .then((keys) => {
        const poltronasLivres = todasPoltronas.filter((poltrona) => {
          return !keys.includes(poltrona)
        });
        dispatch(setPoltronas(poltronasLivres));
        dispatch(actions.changePoltrona({
          val: 0,
          text: poltronasLivres[0]
        }));
      })
      .catch(() => {
        // initialize POLTRONA values
        dispatch(setPoltronas(todasPoltronas));
        dispatch(actions.changePoltrona({
          val: 0,
          text: todasPoltronas[0]
        }));
      });
  }

  initializeValues() {
    const { dispatch, cidades, horarios } = this.props;

    // initialize EMAIL
    dispatch(actions.changeEmail(firebaseHelper.getUser().email));

    // initialize ORIGEM values
    dispatch(actions.changeOrigem({
      val: 0,
      text: cidades[0]
    }));

    // initialize DESTINO values
    dispatch(actions.changeDestino({
      val: 1,
      text: cidades[1]
    }));

    // initialize HORARIO values
    dispatch(actions.changeHorario({
      val: 0,
      text: horarios[0]
    }));

    this.updatePoltronas(cidades[0], cidades[1], utils.DateNowBr, horarios[0]);
  }

  handleChangeNome(event) {
    const isPristine = this.props.passagem.nome.isPristine;
    const text = event.target.value;

    this.props.dispatch(actions.changeNome(text));
    isPristine && this.props.dispatch(actions.setNomeDirty());

    this.updateNomeValidation(text);
  }

  updateNomeValidation(text) {
    const oldName = this.props.passagem.nome;

    // test required
    if (text.length > 0) {
      (oldName.validation !== utils.ValidationStatus.SUCCESS) &&
        this.props.dispatch(actions.setNomeValidation(utils.ValidationStatus.SUCCESS, ''));
    } else {
      (oldName.validation !== utils.ValidationStatus.ERROR) &&
        this.props.dispatch(actions.setNomeValidation(utils.ValidationStatus.ERROR, 'Campo obrigatório'));
    }
  }

  handleChangeOrigem(event) {
    const { data, horario } = this.props.passagem;
    const { cidades, dispatch } = this.props;

    // build ORIGEM new state
    const origem = {
      val: Number(event.target.value),
      text: cidades[event.target.value]
    };
    // get DESTINO state
    const destino = {
      val: this.props.passagem.destino.val,
      text: this.props.passagem.destino.text
    };

    // change ORIGEM state!
    dispatch(actions.changeOrigem({
      val: origem.val,
      text: origem.text
    }));

    // if ORIGEM is already selected in DESTINO 
    if (origem.val === destino.val) {
      // calculate new index for DESTINO
      const newIndexDestino = (destino.val === 0) ? (destino.val + 1) : (destino.val - 1);
      const newTextDestino = cidades[newIndexDestino];
      // change DESTINO state!
      dispatch(actions.changeDestino({
        val: newIndexDestino,
        text: newTextDestino
      }));
      this.updatePoltronas(origem.text, newTextDestino, data, horario.text);
    } else {
      this.updatePoltronas(origem.text, destino.text, data, horario.text);
    }
  }

  handleChangeDestino(event) {
    const { data, horario } = this.props.passagem;
    const { cidades, dispatch } = this.props;

    // build DESTINO new state
    const destino = {
      val: Number(event.target.value),
      text: cidades[event.target.value]
    };
    // get ORIGEM state
    const origem = {
      val: this.props.passagem.origem.val,
      text: this.props.passagem.origem.text
    };

    // change DESTINO state!
    dispatch(actions.changeDestino({
      val: destino.val,
      text: destino.text
    }));

    // if DESTINO is already selected in ORIGEM 
    if (destino.val === origem.val) {
      // calculate new index for ORIGEM
      const newIndexOrigem = (origem.val === 0) ? (origem.val + 1) : (origem.val - 1);
      const newTextOrigem = cidades[newIndexOrigem];

      // change ORIGEM state!
      dispatch(actions.changeOrigem({
        val: newIndexOrigem,
        text: newTextOrigem
      }));
      this.updatePoltronas(newTextOrigem, destino.text, data, horario.text);
    } else {
      this.updatePoltronas(origem.text, destino.text, data, horario.text);
    }
  }

  handleChangePoltrona(event) {
    this.props.dispatch(actions.changePoltrona({
      val: event.target.value,
      text: event.target[event.target.value].text
    }));
  }

  handleChangeHorario(event) {
    const { origem, destino, data } = this.props.passagem;
    const novoHorarioText = event.target[event.target.value].text;

    this.props.dispatch(actions.changeHorario({
      val: event.target.value,
      text: novoHorarioText
    }));

    this.updatePoltronas(origem.text, destino.text, data, novoHorarioText);
  }

  handleChangeData(value) {
    const { origem, destino, horario } = this.props.passagem;

    this.props.dispatch(actions.changeData(value));
    this.updatePoltronas(origem.text, destino.text, value, horario.text);
  }

  formCanBeSaved() {
    const { dispatch, passagem } = this.props;
    const { nome } = passagem;
    let countPristines = 0;

    // if NOME is pristine, form cannot be saved
    if (nome.isPristine) {
      countPristines++;
      dispatch(actions.setNomeDirty());
      this.updateNomeValidation(nome.text);
    }

    if ((countPristines > 0) || (nome.validation !== utils.ValidationStatus.SUCCESS)) {
      return false;
    }

    return true;
  }

  handleSubmit(event) {
    const { dispatch, passagem, history } = this.props;

    if (this.formCanBeSaved()) {
      dispatch(newPassagem(passagem))
        .then((key) => {
          history.push({
            pathname: `/passagem/${key}`,
            state: { passagem }
          });
        });
    }

    event.preventDefault();
  }

  handleReset() {
    this.props.dispatch(actions.resetFormPassagem());
    this.initializeValues();
  }

  render() {
    const { cidades, horarios, poltronas, passagem } = this.props;
    const { nome, email } = passagem;

    // render!
    return (
      <div className="form-passagem-container">
        <h2>Compre sua passagem</h2>
        <div className="form-passagem">
          <form onSubmit={this.handleSubmit}>

            {/*NOME*/}
            <Row className="text-left">
              <Col xs={12}>
                <InputField
                  id="nome"
                  label="Nome*"
                  type="text"
                  value={nome.text}
                  onChange={this.handleChangeNome}
                  validation={nome.validation}
                  message={nome.message} />
              </Col>
            </Row>

            {/*E_MAIL*/}
            <Row className="text-left">
              <Col xs={12} className="input-col">
                <InputField
                  id="email"
                  label="E-mail*"
                  type="text"
                  value={email}
                  isDisabled={true} />
              </Col>
            </Row>

            {/*ORIGEM / DESTINO*/}
            <Row className="text-left">
              <Col md={6} className="input-col">
                <SelectField
                  id="origem"
                  label="Origem"
                  list={cidades}
                  value={passagem.origem.val}
                  onChange={this.handleChangeOrigem} />
              </Col>
              <Col md={6} className="input-col">
                <SelectField
                  id="destino"
                  label="Destino"
                  list={cidades}
                  value={passagem.destino.val}
                  onChange={this.handleChangeDestino} />
              </Col>
            </Row>

            {/*POLTRONA / DATA / HORARIO*/}
            <Row className="text-left">
              <Col md={4} className="input-col">
                <SelectField
                  id="poltrona"
                  label="Poltrona"
                  list={poltronas}
                  value={passagem.poltrona.val}
                  onChange={this.handleChangePoltrona} />
              </Col>
              <Col md={4} className="input-col">
                <DateField
                  id="data"
                  label="Data"
                  value={passagem.data}
                  onChange={this.handleChangeData} />
              </Col>
              <Col md={4} className="input-col">
                <SelectField
                  id="horario"
                  label="Horário"
                  list={horarios}
                  value={passagem.horario.val}
                  onChange={this.handleChangeHorario} />
              </Col>
            </Row>
            <hr />
            <Row>
              <Col md={5} className="col-button-left">
                <Button type="submit" bsStyle="primary" className="btn-block">
                  <Glyphicon glyph="shopping-cart" />
                  <span className="text-after-icon">Comprar!</span>
                </Button>
              </Col>
              <Col md={4} className="col-button-right">
                <Button type="button" bsStyle="warning" className="btn-block" onClick={this.handleReset}>
                  <Glyphicon glyph="search" />
                  <span className="text-after-icon">Pesquisar</span>
                </Button>
              </Col>
              <Col md={3} className="col-button-right">
                <Button type="button" bsStyle="danger" className="btn-block" onClick={this.handleReset}>
                  <Glyphicon glyph="erase" />
                  <span className="text-after-icon">Limpar</span>
                </Button>
              </Col>
            </Row>
          </form >
        </div>
      </div >
    );
  }
}

FormPassagem.PropTypes = {
  cidades: PropTypes.array.isRequired,
  horarios: PropTypes.array.isRequired,
  poltronas: PropTypes.array.isRequired
};

const mapStateToProps = (state) => {
  return {
    passagem: state.formPassagemState.passagem,
  };
};

const FormPassagemWithRouter = withRouter(FormPassagem);
const FormPassagemWithRouterAndAuth = withAuth(FormPassagemWithRouter);
export default connect(mapStateToProps)(FormPassagemWithRouterAndAuth);

