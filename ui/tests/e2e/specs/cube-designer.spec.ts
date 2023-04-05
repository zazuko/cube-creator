describe('Cube designer', () => {
  describe('Auto-mapping dimension', () => {
    it('Opens Dimension mapping panel', () => {
      cy.visit('/cube-projects/cube-project!!ubd/metadata/dimension/cube-project!!ubd!!dimensions-metadata!!station/map')
      cy.contains('h2', 'Update mappings')
    })

    it('Starts auto-mapping', () => {
      cy.contains('button', 'Auto-fill')
        .click()

      cy.contains('h2', 'Map terms from a Shared Dimension')
    })

    it('Selects shared dimension', () => {
      cy.contains('form-property', 'Shared dimension')
        .find('sh-sl-autocomplete')
        .should('be.visible')
        .click()

      cy.contains('sl-menu-item', 'Chemical substances')
        .click()
    })

    it('Confirms selection', () => {
      cy.contains('button', 'Map terms from a Shared Dimension')
        .click()

      cy.contains('Mappings updated')
        .should('be.visible')
    })

    it('Closes the panel', () => {
      cy.get('.quickview-header')
        .find('button.delete')
        .click()

      cy.contains('Dimension mappings changed')
        .should('be.visible')
    })
  })
})
