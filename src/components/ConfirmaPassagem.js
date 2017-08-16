import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Jumbotron, Row, Col, Grid } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import { withAuth } from '../shared/hoc';
import DivAnimated from '../shared/DivAnimated'
import { PageHeader } from '../shared/PageHeader';
import TooltipOverlay from '../shared/TooltipOverlay';
import Button from 'react-toolbox/lib/button/Button';
import FontAwesome from 'react-fontawesome';
import * as actions from '../actions/modalTrajeto.actions';

class ConfirmaPassagem extends Component {
  constructor(props) {
    super(props);
    this.handleComprarPassagem = this.handleComprarPassagem.bind(this);
    this.handleHome = this.handleHome.bind(this);
  }

  handleComprarPassagem() {
    this.props.dispatch(actions.setVisible(true, true));
  }

  handleHome() {
    this.props.history.push('/');
  }

  render() {
    const { novaPassagem, novaPassagemVolta, key, keyVolta = null } = this.props.location.state;

    const ButtonContinuarComprando = () =>
      <TooltipOverlay text="Continuar comprando">
        <Button
          floating
          accent
          className="button-continuar-comprando"
          onClick={this.handleComprarPassagem}
          icon={<FontAwesome name="shopping-cart" />}
        />
      </TooltipOverlay>

    return (
      <div className="confirmacao-passagem">
        <PageHeader title="Compra finalizada !">
        </PageHeader>
        <DivAnimated className="form-centered">
          <Grid>
            <Row>
              <Col md={10} mdOffset={1} lg={8} lgOffset={2} className="text-left">
                <Jumbotron className="jumbo-detalhes mui--z2">
                  <Row className="main-body">
                    <div className="label-localizador">
                      Seu código localizador é:
                  </div>
                    <div className="localizador">
                      {key}
                    </div>
                    <div className="detalhes text-left">
                      <Row>
                        <Col sm={6}>
                          <Jumbotron className="jumbo-ida">
                            <div className="body text-right">
                              <div>
                                <span>{novaPassagem.origem}</span>
                                <FontAwesome name="location-arrow fa-fw icon-after-text" />
                              </div>
                              <div>
                                <span>{novaPassagem.destino}</span>
                                <FontAwesome name="map-marker fa-fw icon-after-text" />
                              </div>
                              <div>
                                <span>{novaPassagem.data}</span>
                                <FontAwesome name="calendar fa-fw icon-after-text" />
                              </div>
                              <div>
                                <span>{novaPassagem.horario}</span>
                                <FontAwesome name="clock-o fa-fw icon-after-text" />
                              </div>
                              <div>
                                <span>{novaPassagem.poltrona}</span>
                                <FontAwesome name="bookmark fa-fw icon-after-text" />
                              </div>
                            </div>
                          </Jumbotron>
                        </Col>
                        <Col sm={6}>
                          <Jumbotron className="jumbo-volta">
                            <div className="body">
                              <div>
                                <FontAwesome name="location-arrow fa-fw" />
                                <span className="text-after-icon">{novaPassagemVolta.origem}</span>
                              </div>
                              <div>
                                <FontAwesome name="map-marker fa-fw" />
                                <span className="text-after-icon">{novaPassagemVolta.destino}</span>
                              </div>
                              <div>
                                <FontAwesome name="calendar fa-fw" />
                                <span className="text-after-icon">{novaPassagemVolta.data}</span>
                              </div>
                              <div>
                                <FontAwesome name="clock-o fa-fw" />
                                <span className="text-after-icon">{novaPassagemVolta.horario}</span>
                              </div>
                              <div>
                                <FontAwesome name="bookmark fa-fw" />
                                <span className="text-after-icon">{novaPassagemVolta.poltrona}</span>
                              </div>
                            </div>
                          </Jumbotron>
                        </Col>
                      </Row>
                    </div>
                  </Row>
                  <Row className="bottom-strip">
                    <div className="paragrafo-email">
                      Um e-mail foi enviado para <strong>{novaPassagem.email}</strong> com todos os detalhes da a sua compra.
                  </div>
                    <div className="paragrafo-parabens">Agradecemos a sua preferência e tenha uma ótima viagem!</div>
                  </Row>
                  <ButtonContinuarComprando />
                  {/*<ButtonHome />*/}
                </Jumbotron>
              </Col>
            </Row>
          </Grid>
        </DivAnimated>
      </div>
    );
  }
}

ConfirmaPassagem.PropTypes = {
  novaPassagem: PropTypes.object.isRequired,
  novaPassagemVolta: PropTypes.object.isRequired,
  key: PropTypes.string.isRequired,
  keyVolta: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => {
  return {};
};

const ConfirmaPassagemWithRouter = withRouter(ConfirmaPassagem);
const ConfirmaPassagemWithRouterAndAuth = withAuth(ConfirmaPassagemWithRouter);
export default connect(mapStateToProps)(ConfirmaPassagemWithRouterAndAuth);