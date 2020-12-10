// https://docs.cypress.io/api/introduction/api.html

describe('CSV mapping flow', () => {
  it('Visits the app root url', () => {
    cy.visit('/app')
    cy.contains('a', 'Cube Creator')
  })

  it('Goes to projects list', () => {
    cy.contains('a', 'Cube Projects').click()
  })

  it('Creates a new project', () => {
    cy.contains('.button', 'New project').click()

    cy.contains('.form-property', 'Project name')
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

  it('Creates an observation table from a selection of columns', () => {
    cy.contains('column1').click()
    cy.contains('column3').click()

    cy.contains('.button', 'Create table from selected columns').click()

    cy.contains('.form-property', 'Table name')
      .find('input')
      .type('My observations')

    cy.contains('.label', 'Observation')
      .click()

    cy.get('form').submit()

    cy.contains('.message', 'Table My observations was successfully created').should('be.visible')
    cy.contains('.mapper-table', 'My observations').should('be.visible')
    cy.get('[data-icon=eye]').should('be.visible')
  })

  it('Adds a literal column mapping to a table', () => {
    cy.contains('.mapper-table', 'My observations')
      .find('[data-testid=create-column-mapping]')
      .click()

    cy.contains('Literal value').click()

    cy.contains('Source Column')
      .find('select')
      .select('column2')

    cy.contains('Target Property')
      .find('input')
      .type('schema:identifier')

    cy.contains('Data type')
      .find('select')
      .select('string')

    cy.contains('Data type')
      // Click somewhere to validate the datatype selection
      .click()

    cy.get('form')
      .submit()

    cy.contains('.message', 'Column mapping was successfully created').should('be.visible')
    cy.contains('.mapper-table', 'schema:identifier').should('be.visible')
  })

  it('Creates a second table', () => {
    cy.get('[data-testid=create-table]').click()

    cy.contains('Source CSV file')
      .find('select')
      .select('test.csv')

    cy.contains('.form-property', 'Table name')
      .find('input')
      .type('My secondary table')

    cy.contains('.form-property', 'Identifier template')
      .find('input')
      .type('{column2}', { parseSpecialCharSequences: false })

    cy.get('form').submit()

    cy.contains('.message', 'Table My secondary table was successfully created').should('be.visible')
    cy.contains('.mapper-table', 'My secondary table').should('be.visible')
      .find('[data-icon=eye]').should('not.be.visible')
  })

  it('Adds a reference column mapping to a table', () => {
    cy.contains('.mapper-table', 'My observations')
      .find('[data-testid=create-column-mapping]')
      .click()

    cy.contains('Link to another table').click()

    cy.contains('.field', 'Link to table')
      .find('select')
      .select('My secondary table')

    cy.contains('.field', 'Using the property')
      .type('{selectall}the-other')

    cy.get('form')
      .submit()

    cy.contains('.message', 'Column mapping was successfully created').should('be.visible')
    cy.contains('.mapper-table', 'the-other').should('be.visible')
  })

  it('Deletes a table', () => {
    cy.contains('.mapper-table', 'My secondary table')
      .find('[data-testid=delete-table]').click()

    cy.contains('.button', 'Delete').click()

    cy.contains('.message', 'Table My secondary table deleted successfully').should('be.visible')
    cy.contains('.mapper-table', 'My secondary table').should('not.be.visible')
  })
})
