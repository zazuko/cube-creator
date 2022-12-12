import { nanoid } from 'nanoid'

describe('CSV mapping flow', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('a', 'Cube Creator')
  })

  it('Goes to projects list', () => {
    cy.contains('a', 'Cube Projects').click()
  })

  it('Creates a new project', () => {
    cy.contains('.button', 'New project').click()

    cy.contains('form-property', 'Project name')
      .find('input')
      .type('My project')

    cy.contains('form-property', 'Publishing profile')
      .find('sl-select')
      .click()
      .contains('sl-menu-item', 'Federal Office for the Environment')
      .click()

    cy.contains('form-property', 'Cube identifier')
      .find('input')
      .type('ubd/' + nanoid())

    cy.get('div.quickview-body form').submit()

    cy.contains('successfully created').should('be.visible')
    cy.contains('h2', 'My project').should('be.visible')
  })

  it('Uploads a CSV file', () => {
    cy.get('[data-testid="upload-source"]').click()

    cy.contains('browse files').click()

    cy.fixture('test.csv').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent: fileContent.toString(),
        filePath: 'test.csv',
        mimeType: 'text/csv',
      })
    })

    cy.contains('Upload 1 file').click()

    cy.contains('Done').click()

    cy.contains('uploaded').should('be.visible')
    cy.reload()

    cy.contains('test.csv').should('be.visible')
    cy.contains('column1').should('be.visible')
    cy.contains('(value 1)').should('be.visible')
    cy.contains('column2').should('be.visible')
    cy.contains('(value 2)').should('be.visible')
    cy.contains('column3').should('be.visible')
    cy.contains('(22.45, 23.45)').should('be.visible')
  })

  it('Creates a cube table from a selection of columns', () => {
    cy.contains('column1').click()
    cy.contains('column3').click()

    cy.contains('.button', 'Create table from selected columns').click()

    cy.contains('form-property', 'Table name')
      .find('input')
      .type('My observations')

    cy.contains('.label', 'Cube table')
      .siblings('form-object')
      .find('cc-checkbox')
      .should('be.visible')
      .click()

    cy.get('form').submit()

    cy.contains('Cube: My observations').should('be.visible')
    cy.contains('.mapper-table', 'My observations')
      .should('be.visible')
      .should('contain.text', 'Cube:')
  })

  it('Adds a literal column mapping to a table', () => {
    cy.contains('.mapper-table', 'My observations')
      .find('[data-testid=create-column-mapping]')
      .click()

    cy.contains('Literal value').click()

    cy.contains('Source Column')
      .siblings('form-object')
      .find('sl-select')
      .should('be.visible')
      .click()
      .contains('sl-menu-item', 'column2')
      .click()

    cy.contains('Target Property')
      .siblings('form-object')
      .find('input')
      .type('schema:identifier')

    cy.contains('Data type')
      .parent('form-property')
      .shadow()
      .find('[name=plus]')
      .click()

    cy.contains('Data type')
      .siblings('form-object')
      .find('sl-select')
      .click()
      .contains('sl-menu-item', 'string')
      .click()

    cy.contains('Data type')
      // Click somewhere to validate the datatype selection
      .click()

    cy.get('form')
      .submit()

    cy.contains('Column mapping was successfully created').should('be.visible')
    cy.contains('.mapper-table', 'schema:identifier').should('be.visible')
  })

  it('Creates a second table', () => {
    cy.get('[data-testid=create-table]').click()

    cy.contains('Source CSV file')
      .siblings('form-object')
      .find('sl-select')
      .should('be.visible')
      .click()
      .contains('sl-menu-item', 'test.csv')
      .click()

    cy.contains('form-property', 'Table name')
      .find('input')
      .type('My secondary table')

    cy.contains('form-property', 'Identifier template')
      .find('input')
      .type('{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}column2{}}')

    cy.get('form').submit()

    cy.contains('Table My secondary table was successfully created').should('be.visible')
    cy.contains('.mapper-table', 'My secondary table')
      .should('be.visible')
      .should('contain.text', 'Concept:')
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

    cy.contains('Column mapping was successfully created').should('be.visible')
    cy.contains('.mapper-table', 'the-other').should('be.visible')
  })

  it('Deletes a table', () => {
    cy.contains('.mapper-table', 'My secondary table')
      .find('[data-testid=delete-table]').click()

    cy.contains('.button', 'Delete').click()

    cy.contains('Table My secondary table deleted successfully').should('be.visible')
    cy.contains('.mapper-table', 'My secondary table').should('not.exist')
  })

  it('Deletes project', () => {
    cy.contains('My project')
      .click()

    cy.contains('Delete Project')
      .click()

    cy.contains('Are you sure').should('be.visible')

    cy.get('.modal')
      .contains('button', 'Delete')
      .click({ force: true })

    cy.contains('Project My project successfully deleted').should('be.visible')
  })
})
