'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useFluidFunds } from '@/app/hooks/useFluidFunds'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { uploadToIPFS, uploadFundMetadata, getIPFSUrl, uploadToIPFSWithProgress } from '@/app/services/ipfs'
import Image from 'next/image'
import type { FundMetadata } from '@/app/types/fund'
import { toast } from 'sonner'
import { setFundMetadataUri, addExistingFundMetadata } from '@/app/utils/fundMetadataMap'
import { useWalletClient } from 'wagmi'

interface CreateFundModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateFundModal({ isOpen, onClose }: CreateFundModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [profitSharingPercentage, setProfitSharingPercentage] = useState('')
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('')
  const [minInvestmentAmount, setMinInvestmentAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [strategy, setStrategy] = useState('')
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    discord: '',
    telegram: ''
  })

  const { createFund, getFundAddressFromReceipt } = useFluidFunds()
  const { data: walletClient } = useWalletClient()

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setUploadProgress(0)

    try {
      if (!walletClient?.account) {
        throw new Error('No wallet connected')
      }

      // Validate inputs
      if (!name.trim()) {
        throw new Error('Fund name is required')
      }

      const percentage = parseInt(profitSharingPercentage)
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        throw new Error('Profit sharing percentage must be between 1 and 100')
      }

      const endDate = new Date(subscriptionEndDate)
      const subscriptionEndTime = Math.floor(endDate.getTime() / 1000)
      const now = Math.floor(Date.now() / 1000)
      if (subscriptionEndTime <= now) {
        throw new Error('Subscription end time must be in the future')
      }

      const minAmount = parseFloat(minInvestmentAmount)
      if (isNaN(minAmount) || minAmount <= 0) {
        throw new Error('Minimum investment amount must be greater than 0')
      }

      console.log('Creating fund with validated params:', {
        name,
        profitSharingPercentage: percentage,
        subscriptionEndTime,
        minInvestmentAmount: minAmount.toString()
      })

      // First create the fund
      const hash = await createFund({
        name,
        profitSharingPercentage: percentage,
        subscriptionEndTime,
        minInvestmentAmount: minAmount.toString()
      })
      console.log('Fund creation transaction hash:', hash)

      // Get the fund's address from the transaction receipt
      let fundAddress: string
      try {
        fundAddress = await getFundAddressFromReceipt(hash)
        console.log('Fund address from receipt:', fundAddress)
      } catch (error) {
        console.error('Error getting fund address:', error)
        toast.error('Fund created but address not found. Please check the transaction.')
        return
      }

      const managerAddress = walletClient.account.address
      console.log('Fund created:', { fundAddress, managerAddress })

      // Upload image to IPFS if exists
      let imageUrl = ''
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0]
        const progress = (loaded: number, total: number) => {
          setUploadProgress((loaded / total) * 100)
        }
        const imageHash = await uploadToIPFSWithProgress(file, progress)
        imageUrl = `ipfs://${imageHash}`
        console.log('Uploaded image URL:', imageUrl)
      }

      // Prepare metadata for IPFS
      const metadata: FundMetadata = {
        name,
        description,
        image: imageUrl,
        manager: managerAddress,
        strategy,
        socialLinks: {
          twitter: socialLinks.twitter,
          discord: socialLinks.discord,
          telegram: socialLinks.telegram
        },
        performanceMetrics: {
          tvl: '0',
          returns: '0',
          investors: 0
        },
        updatedAt: Date.now()
      }

      // Upload metadata to IPFS
      console.log('Uploading metadata to IPFS:', metadata)
      const metadataHash = await uploadFundMetadata(metadata)
      const metadataUri = `ipfs://${metadataHash}`
      console.log('Uploaded metadata URI:', metadataUri)

      // Store the metadata URI mapping
      console.log('Storing metadata mapping:', {
        fundAddress,
        metadataUri,
        managerAddress
      })
      setFundMetadataUri(fundAddress, metadataUri, managerAddress)

      // Store metadata URI in local storage
      addExistingFundMetadata(
        fundAddress,
        `ipfs://${metadataHash}`,
        managerAddress
      )

      onClose()
      toast.success('Fund created successfully!')
    } catch (error) {
      console.error('Error creating fund:', error)
      toast.error(error instanceof Error ? error.message : 'Error creating fund')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-6 rounded-xl bg-[#0A0A0A] border border-white/[0.08]"
      >
        <h2 className="text-xl font-medium mb-6">Create New Fund</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-48 h-48 rounded-xl bg-white/[0.05] border-2 border-dashed border-white/[0.08] 
                         flex items-center justify-center cursor-pointer overflow-hidden relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewImage ? (
                <>
                  <Image
                    src={previewImage}
                    alt="Fund preview"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white">{Math.round(uploadProgress)}%</div>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-white/40">Click to upload image</span>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Fund Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Fund Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                rows={3}
              />
            </div>

            {/* Existing fields */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Profit Sharing (%)</label>
              <input
                type="number"
                value={profitSharingPercentage}
                onChange={(e) => setProfitSharingPercentage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Subscription End Date</label>
              <input
                type="datetime-local"
                value={subscriptionEndDate}
                onChange={(e) => setSubscriptionEndDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] 
                         text-white focus:outline-none focus:border-fluid-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Min Investment (USDC)</label>
              <input
                type="text"
                value={minInvestmentAmount}
                onChange={(e) => setMinInvestmentAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                required
              />
            </div>
          </div>

          {/* New fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Strategy</label>
              <input
                type="text"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Twitter</label>
              <input
                type="text"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Discord</label>
              <input
                type="text"
                value={socialLinks.discord}
                onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Telegram</label>
              <input
                type="text"
                value={socialLinks.telegram}
                onChange={(e) => setSocialLinks({ ...socialLinks, telegram: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-fluid-primary text-white font-medium 
                       hover:bg-fluid-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Fund'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
} 