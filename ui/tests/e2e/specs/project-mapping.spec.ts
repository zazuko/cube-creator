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

    cy.get('form').submit()

    cy.contains('.message', 'successfully created').should('be.visible')
    cy.contains('h2', 'My project').should('be.visible')
  })

  it('Uploads a CSV file', () => {
    cy.get('[data-testid="upload-source"]').click()

    cy.contains('select files').click()

    cy.fixture('test.csv').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent: fileContent.toString(),
        filePath: 'test.csv',
        mimeType: 'text/csv',
      })
    })

    cy.get('form').submit()

    cy.contains('test.csv').should('be.visible')
    cy.contains('column1').should('be.visible')
    cy.contains('(value 1)').should('be.visible')
    cy.contains('column2').should('be.visible')
    cy.contains('(value 2)').should('be.visible')
    cy.contains('column3').should('be.visible')
    cy.contains('(22.45, 23.45)').should('be.visible')
  })
})
