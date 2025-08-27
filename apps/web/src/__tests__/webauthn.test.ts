import { registerWebAuthn, authenticateWebAuthn } from '@/lib/webauthn'

// Mock @simplewebauthn/browser
jest.mock('@simplewebauthn/browser', () => ({
  startRegistration: jest.fn(),
  startAuthentication: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('WebAuthn Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerWebAuthn', () => {
    it('should successfully register a WebAuthn credential', async () => {
      const mockOptions = { challenge: 'test-challenge' }
      const mockAttResp = { id: 'credential-id' }
      const mockVerification = { verified: true }

      // Mock fetch responses
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOptions),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockVerification),
        })

      // Mock startRegistration
      const { startRegistration } = require('@simplewebauthn/browser')
      startRegistration.mockResolvedValue(mockAttResp)

      const result = await registerWebAuthn('test-token')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(startRegistration).toHaveBeenCalledWith(mockOptions)
      expect(result).toEqual(mockVerification)
    })

    it('should throw error when registration options request fails', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      await expect(registerWebAuthn('test-token')).rejects.toThrow(
        'Failed to get registration options'
      )
    })
  })

  describe('authenticateWebAuthn', () => {
    it('should successfully authenticate with WebAuthn', async () => {
      const mockOptions = { challenge: 'test-challenge' }
      const mockAsseResp = { id: 'credential-id' }
      const mockVerification = { verified: true, user: { id: 'user-id' } }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOptions),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockVerification),
        })

      const { startAuthentication } = require('@simplewebauthn/browser')
      startAuthentication.mockResolvedValue(mockAsseResp)

      const result = await authenticateWebAuthn('user-id')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(startAuthentication).toHaveBeenCalledWith(mockOptions)
      expect(result).toEqual(mockVerification)
    })

    it('should throw error when authentication fails', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      await expect(authenticateWebAuthn('user-id')).rejects.toThrow(
        'Failed to get authentication options'
      )
    })
  })
})
