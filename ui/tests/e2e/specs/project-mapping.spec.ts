// https://docs.cypress.io/api/introduction/api.html

describe('Project creation', () => {
  it('Visits the app root url', () => {
    cy.visit('/app')
    cy.contains('a', 'Cube Creator')
  })

  it('Goes to projects list', () => {
    cy.contains('a', 'Cube Projects').click()
  })

  it('Creates a new project', () => {
    cy.contains('.button', 'New project').click()

    cy.contains('.label', 'Project name')
      .next()
      .find('input')
      .type('My project')

    cy.contains('.button', 'Create project').click()

    cy.contains('.message', 'successfully created').should('be.visible')
    cy.contains('h2', 'My project').should('be.visible')
  })
})
