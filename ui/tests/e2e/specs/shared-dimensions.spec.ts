import slugify from 'slugify'

describe('CSV mapping flow', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('a', 'Cube Creator')
  })

  it('Goes to shared dimensions list', () => {
    cy.contains('a', 'Shared Dimensions').click()
    cy.contains('h2', 'Shared Dimensions')
  })

  it('Creates a new shared dimension', () => {
    const dimensionName = `My dimension ${random()}`

    cy.contains('.button', 'Create shared dimension').click()

    cy.contains('.form-property', 'Identifier')
      .find('input')
      .type(toIdentifier(dimensionName))

    cy.contains('.form-property', 'Name')
      .find('input')
      .type(dimensionName)

    cy.contains('.form-property', 'Name')
      .find('select')
      .select('en')

    cy.contains('button', 'Create').click()

    cy.contains('successfully created').should('be.visible')
    cy.contains('h2', dimensionName).should('be.visible')
  })

  it('Creates a new term', () => {
    const termName = `My term ${random()}`

    cy.contains('.button', 'Add term').click()

    cy.contains('.form-property', 'Identifier')
      .find('input')
      .type(toIdentifier(termName))

    cy.contains('.form-property', 'Name')
      .find('input')
      .type(termName)

    cy.contains('.form-property', 'Name')
      .find('select')
      .select('en')

    cy.contains('button', 'Create').click()

    cy.contains('successfully created').should('be.visible')
    cy.contains(`${termName}@en`).should('exist')
  })
})

function random (): string {
  return Date.now().toString()
}

function toIdentifier (name: string): string {
  return slugify(name, { lower: true })
}
