import React, { Component } from 'react';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux';
import * as actions from '../actions/compraPassagem.actions';
import { globals } from '../shared/Globals';
import { withAuth } from '../shared/hoc';
import { firebaseHelper } from '../shared/FirebaseHelper';
import * as utils from '../shared/Utils';
import { Navbar, Label, Tabs, Tab, Button } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import DivAnimated from '../shared/DivAnimated'
import moment from 'moment';
import { PageHeader, PageHeaderItem } from '../shared/PageHeader';
import * as loadingActions from '../actions/loadingDialog.actions'
import * as modalTrajetoActions from '../actions/modalTrajeto.actions'
import { ButtonIcon } from '../shared/ButtonIcon';
import HorariosAccordion from './HorariosAccordion';
import { withNoResults } from '../shared/hoc';
import seatLogo from '../styles/images/seat2.svg';
import examLogo from '../styles/images/exam.svg';
import reviewLogo from '../styles/images/review.svg';
import idaLogo from '../styles/images/ida.svg';
import voltaLogo from '../styles/images/volta.svg';

const helper = {
  mapPassagemToFirebase(passagem) {
    return {
      ...passagem,
      nome: firebaseHelper.getUserName(),
      cpf: firebaseHelper.getUserCpf(),
      email: firebaseHelper.getUserEmail(),
      origem: passagem.origem.text,
      destino: passagem.destino.text,
      horario: passagem.horario.text,
      poltrona: passagem.poltrona.value,
      dataCompra: utils.DateNowBr
    };
  },
  poltronaToFirebase(poltrona) {
    return new Promise((resolve) => {
      const todasPoltronas = globals.getPoltronas();
      const array = poltrona.split(',');
      const padArray = array.map(item => (todasPoltronas[item].label).padStart(2, '0'));
      padArray.sort();
      const padString = padArray.join();
      const formatted = padString.replace(/,/g, ' - ');
      resolve(formatted);
    });
  }
};

export class CompraPassagem extends Component {
  constructor(props) {
    super(props);
    this.canRender = false;
    this.handleReset = this.handleReset.bind(this);
    this.handleChangePoltrona = this.handleChangePoltrona.bind(this);
    this.handleChangeHorario = this.handleChangeHorario.bind(this);
    this.handleClickSeat = this.handleClickSeat.bind(this);
    this.handleResetSeats = this.handleResetSeats.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePesquisarPassagens = this.handlePesquisarPassagens.bind(this);
    this.handleChangeTrajeto = this.handleChangeTrajeto.bind(this);
  }

  handleChangeTrajeto(event) {
    event.preventDefault();
    const { dispatch, snapshot } = this.props;
    dispatch(actions.SetFrozen(true));
    dispatch(modalTrajetoActions.setVisible(true, false, snapshot));
  }

  handleClickSeat(isVolta, horario, value, status) {
    const { dispatch, horarios, horariosVolta } = this.props;

    // se a poltrona já está ocupada, não faz nada
    if (status === utils.PoltronaStatus.RESERVED) {
      return;
    }

    const updatedHorarios = utils.deepCopy(isVolta ? horariosVolta : horarios);

    if (status === utils.PoltronaStatus.FREE) {
      updatedHorarios[horario][value] = utils.PoltronaStatus.SELECTED;
    } else if (status === utils.PoltronaStatus.SELECTED) {
      updatedHorarios[horario][value] = utils.PoltronaStatus.FREE;
    }

    !isVolta && dispatch(actions.setHorarios(updatedHorarios));
    isVolta && dispatch(actions.setHorariosVolta(updatedHorarios));
    // dispatch(actions.changePoltrona(newPoltronaVal));
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !this.props.isFrozen;
  }

  handleResetSeats() {
    const isPristine = this.props.passagem.poltrona.isPristine;
    !isPristine && this.handleChangePoltrona('');
  }

  initLoadingDialog() {
    const { dispatch } = this.props;
    dispatch(loadingActions.setLoadingMessage('Salvando dados...'));
    dispatch(loadingActions.setLoadingIcon('spinner'));
  }

  componentDidMount() {
    this.initLoadingDialog();
  }

  updatePoltronas(origem, destino, data, horario) {
    const { dispatch } = this.props;
    const todasPoltronas = globals.getPoltronas();

    // se não há mais horários de saída no dia,
    // então desabilita as poltronas e retorna
    if (horario.length === 0) {
      const newPoltronas = todasPoltronas.map((poltrona) => {
        return {
          ...poltrona,
          disabled: true,
          status: utils.PoltronaStatus.RESERVED
        };
      });
      dispatch(actions.setPoltronas(newPoltronas));
      dispatch(actions.changePoltrona(''));
      return;
    }

    // monnta o ref para procurar por poltronas
    // já reservadas neste dia
    const dataFormatted = utils.dateToFirebase(data);
    const horarioFormatted = utils.timeToFirebase(horario);
    const saidasRef = `saidas/${origem}/${destino}/${dataFormatted}/${horarioFormatted}/`;

    // percorre as poltronas já reservadas
    firebaseHelper.fetchKeys(saidasRef)
      .then((keys) => { // desabilta as que foram encontradas
        const poltronasLivres = todasPoltronas.map((poltrona, index, arr) => {
          const numeroPoltrona = Number(arr[poltrona.value].label);
          const isDisabled = keys.includes(numeroPoltrona);
          return {
            ...poltrona,
            disabled: isDisabled,
            status: isDisabled ? utils.PoltronaStatus.RESERVED : utils.PoltronaStatus.FREE
          };
        });
        dispatch(actions.setPoltronas(poltronasLivres));
        dispatch(actions.changePoltrona(''));
      })
      .catch(() => { // se não encontrou nada, carrega a lista default
        dispatch(actions.setPoltronas(todasPoltronas));
        dispatch(actions.changePoltrona(''));
      });
  }

  updateHorarios(data, isClear = false) {
    const { dispatch } = this.props;
    const { horario } = this.props.passagem;

    // get current date
    const dtNow = new Date().toLocaleDateString('pt-BR');
    const tmNow = new Date().toLocaleTimeString('pt-BR');
    const now = utils.buildDateObj(dtNow, tmNow);

    // filter only the future HORARIOS
    const newHorarios = globals.horarios.filter((hora) => {
      const curr = utils.buildDateObj(data, hora);
      return curr > now;
    });

    // set HORARIOS
    dispatch(actions.setHorarios(newHorarios));

    // set default values for HORARIO
    let newHorario = '';
    let index = 0;

    if (newHorarios.length > 0) {
      newHorario = newHorarios[0];

      // check if the current HORARIO is present in the new HORARIOS array
      if ((horario.text.length > 0) && (!isClear)) {
        index = newHorarios.indexOf(horario.text);
        if (index >= 0) {
          newHorario = newHorarios[index];
        }
      }

      // update HORARIO values
      dispatch(actions.changeHorario({
        val: index,
        text: newHorario
      }));

    } else {
      // VALIDAR HORARIOS
    }

    return newHorario;
  }

  initializeValues() {
    const { dispatch, cidades } = this.props;
    const newHorario = this.updateHorarios(utils.DateNowBr, true);
    dispatch(actions.changeData(moment().format('DD/MM/YYYY')));
    this.updatePoltronas(cidades[0], cidades[1], utils.DateNowBr, newHorario);
  }

  updateStatusPoltronas(oldValue, newValue) {
    const { dispatch } = this.props;
    const hasSelection = (newValue.length > 0);

    const isNewValueEmpty = (newValue.length === 0);
    const isOldValueEmpty = (oldValue.length === 0);

    const newPoltronas = utils.deepCopy(this.props.poltronas);
    const arrayNew = newValue.split(',');
    const arrayOld = oldValue.split(',');

    if (isNewValueEmpty) {
      if (!isOldValueEmpty) {
        arrayOld.map((item) => {
          newPoltronas[item].status = utils.PoltronaStatus.FREE;
          return item;
        });
      }
    } else {
      if (hasSelection) {
        const diffNewToOld = arrayNew.filter((item) => {
          return !arrayOld.includes(item);
        });

        if (diffNewToOld.length > 0) {
          const index = diffNewToOld[0];
          newPoltronas[index].status = utils.PoltronaStatus.SELECTED; // adiciona
        } else {
          const diffOldToNew = arrayOld.filter((item) => {
            return !arrayNew.includes(item);
          })

          if (diffOldToNew.length > 0) {
            const index = diffOldToNew[0];
            newPoltronas[index].status = utils.PoltronaStatus.FREE; // remove
          }
        }
      }
    }

    dispatch(actions.setPoltronas(newPoltronas));

    return hasSelection;
  }

  handleChangePoltrona(value) {
    const { dispatch, passagem } = this.props;
    const isPristine = passagem.poltrona.isPristine;
    const hasSelection = this.updateStatusPoltronas(passagem.poltrona.value, value);

    // altera poltrona e seta como 'dirty'
    dispatch(actions.changePoltrona(value));
    isPristine && dispatch(actions.setPoltronaDirty());

    // valida poltrona
    this.updatePoltronaValidation(hasSelection);
  }

  updatePoltronaValidation(hasSelection) {
    const { dispatch, passagem } = this.props;
    const oldPoltrona = passagem.poltrona;

    // test required
    if (hasSelection) {
      (oldPoltrona.validation !== utils.ValidationStatus.NONE) &&
        dispatch(actions.setPoltronaValidation(utils.ValidationStatus.NONE, ''));
    } else {
      (oldPoltrona.validation !== utils.ValidationStatus.ERROR) &&
        dispatch(actions.setPoltronaValidation(utils.ValidationStatus.ERROR, 'Escolha ao menos uma poltrona'));
    }
  }

  handleChangeHorario(event) {
    const { dispatch, passagem } = this.props;
    const { origem, destino, data } = passagem;
    const novoHorarioText = event.target[event.target.value].text;

    dispatch(actions.changeHorario({
      val: event.target.value,
      text: novoHorarioText
    }));

    this.updatePoltronas(origem.text, destino.text, data, novoHorarioText);
  }

  formCanBeSaved() {
    const { dispatch, passagem, horarios } = this.props;
    const { poltrona } = passagem;
    let failed = false;

    if (horarios.length === 0) {
      failed = true;
    }

    // if POLTRONA is pristine, form cannot be saved
    if (poltrona.isPristine) {
      failed = true;
      const hasSelection = (poltrona.value.length > 0);
      dispatch(actions.setPoltronaDirty());
      this.updatePoltronaValidation(hasSelection);
    }

    if ((failed) || (poltrona.validation !== utils.ValidationStatus.NONE)) {
      return false;
    }

    return true;
  }

  handleSubmit(event) {
    event.preventDefault();
    const { dispatch, passagem, history } = this.props;

    dispatch(loadingActions.setStatus(utils.SavingStatus.SAVING));

    if (this.formCanBeSaved()) {
      this.savePassagem(passagem)
        .then((obj) => {
          setTimeout(function () {
            dispatch(loadingActions.setStatus(utils.SavingStatus.DONE));
            history.push({
              pathname: `/passagem/${obj.key}`,
              state: {
                novaPassagem: obj.novaPassagem,
                key: obj.key
              }
            });
          }, 1000);
        })
        .catch((error) => {
          dispatch(loadingActions.setStatus(utils.SavingStatus.DONE));
        });
    } else {
      dispatch(loadingActions.setStatus(utils.SavingStatus.DONE));
    }
  }

  handleReset(event) {
    event.preventDefault();
    this.reset();
  }

  reset() {
    const { dispatch } = this.props;
    dispatch(actions.resetFormPassagem());
    this.initializeValues();
  }

  handlePesquisarPassagens(event) {
    event.preventDefault();
    this.props.history.push('/passagens');
  }

  savePassagem(passagem) {
    return new Promise((resolve, reject) => {
      const novaPassagem = helper.mapPassagemToFirebase(passagem);
      const { nome, email, cpf, origem, destino, data, horario, dataCompra } = novaPassagem;

      helper.poltronaToFirebase(novaPassagem.poltrona)
        .then((poltronasFormatadas) => {
          novaPassagem.poltrona = poltronasFormatadas;
          const dataFormatted = utils.dateToFirebase(data);
          const horarioFormatted = utils.timeToFirebase(horario);
          const emailFirebase = utils.emailToFirebaseKey(email);
          const newPassgemRef = `passagens/${emailFirebase}`;
          const poltronasSelecionadas = novaPassagem.poltrona.split(' - ');

          // salva passagem numa lista global
          firebaseHelper.save(novaPassagem, newPassgemRef)
            .then((key) => {

              // percorre as poltronas selecionada e salva uma por uma
              poltronasSelecionadas.forEach((val, index, arr) => {
                firebaseHelper.set({ nome, email, cpf, dataCompra },
                  `saidas/${origem}/${destino}/${dataFormatted}/${horarioFormatted}/${val}/`)
                  .then(() => {
                    if (index === (arr.length - 1)) {
                      resolve({ novaPassagem, key });
                    }
                  });
              });
            });
        });
    });
  };

  render() {
    const { horarios, horariosVolta, cidades, passagem, passagemVolta,
      isIdaVolta, activeAccordion, activeAccordionVolta } = this.props;
    const momentIda = moment(passagem.data.value, 'DD/MM/YYYY');
    const strDataIda = momentIda.format('DD/MM/YYYY');
    const momentVolta = moment(passagemVolta.data.value, 'DD/MM/YYYY');
    const strDataVolta = momentVolta.format('DD/MM/YYYY');
    const strOrigem = cidades[passagem.origem.value].label;
    const strDestino = cidades[passagem.destino.value].label;
    const NoResultsAccordionIda = withNoResults(HorariosAccordion, horarios);
    const NoResultsAccordionVolta = withNoResults(HorariosAccordion, horariosVolta);

    return (
      <div className="comprar-passagem-container">
        <PageHeader title="Compre sua passagem">
          <PageHeaderItem tooltip="Ver histórico de compras" glyph="history" onClick={this.handlePesquisarPassagens} />
          <PageHeaderItem tooltip="Limpar campos" glyph="eraser" onClick={this.handleReset} />
        </PageHeader>
        <Navbar className="navbar-trajeto">
          <Navbar.Text className="text-trajeto">
            <span className="text-trajeto-cidades">
              <FontAwesome name="location-arrow" className="icon" />
              <span className="text-after-icon">{strOrigem}</span>
              <FontAwesome name="map-marker" className="text-trajeto-cidades-icondestino icon" />
              <span className="text-after-icon">{strDestino}</span>
            </span>
          </Navbar.Text>
          <Navbar.Text pullRight className="text-config">
            <ButtonIcon
              type="button"
              className="btn-google-glass"
              label="Alterar"
              icon="cog"
              onClick={this.handleChangeTrajeto} />
          </Navbar.Text>
        </Navbar>
        <div className="form-passagem-container">
          <DivAnimated className="form-centered">
            <div className="horarios-container">
              <Tabs
                defaultActiveKey={1}
                id="tab-horarios"
                className={isIdaVolta ? "tab-control" : "tab-control-only-ida"}
                animation={true}>
                <Tab eventKey={1} title={
                  <span className="tab-left">
                    <img src={idaLogo} alt="" className="icon-ida" />
                    <span className="title-after-icon">{strDataIda}</span>
                  </span>
                }>
                  <NoResultsAccordionIda
                    className="accordion-ida"
                    color="indigo-100"
                    isVolta={false}
                    horarios={horarios}
                    active={activeAccordion}
                    onClickSeat={this.handleClickSeat} />
                </Tab>

                {isIdaVolta &&
                  <Tab eventKey={2} className="tab-volta" title={
                    <span className="tab-left">
                      <img src={voltaLogo} alt="" className="icon-ida" />
                      <span className="title-after-icon">{strDataVolta}</span>
                    </span>
                  }>
                    <NoResultsAccordionVolta
                      className="accordion-volta"
                      color="indigo-100"
                      isVolta={true}
                      horarios={horariosVolta}
                      active={activeAccordionVolta}
                      onClickSeat={this.handleClickSeat} />
                  </Tab>
                }
              </Tabs>
              <Button type="button" className="btn-google-yellow btn-revisar btn-block">
                <img src={reviewLogo} alt="" className="icon-review" />
                <span className="finalizar-text">
                  Revise e finalize a sua reserva!
                </span>
              </Button>

            </div>
          </DivAnimated>
        </div>
      </div >
    );
  }
}

const mapStateToProps = (state) => {
  return {
    cidades: state.compraPassagemState.cidades,
    horarios: state.compraPassagemState.horarios,
    horariosVolta: state.compraPassagemState.horariosVolta,
    poltronas: state.compraPassagemState.poltronas,
    passagem: state.compraPassagemState.passagem,
    passagemVolta: state.compraPassagemState.passagemVolta,
    isIdaVolta: state.compraPassagemState.isIdaVolta,
    isFrozen: state.compraPassagemState.isFrozen,
    activeAccordion: state.compraPassagemState.activeAccordion,
    activeAccordionVolta: state.compraPassagemState.activeAccordionVolta,
    snapshot: state.compraPassagemState
  };
};

const CompraPassagemWithRouter = withRouter(CompraPassagem);
const CompraPassagemWithRouterAndAuth = withAuth(CompraPassagemWithRouter);
export default connect(mapStateToProps)(CompraPassagemWithRouterAndAuth);